import Anthropic from '@anthropic-ai/sdk'
import type { SkillHandler } from './skills/types.js'

interface SkillRoute {
  keywords: string[]
  handler: SkillHandler
  name: string
  description: string
}

const routes: SkillRoute[] = []
let anthropic: Anthropic | null = null

export function registerSkill(name: string, keywords: string[], handler: SkillHandler, description?: string): void {
  routes.push({ name, keywords, handler, description: description || name })
}

/**
 * Route a message to the correct skill using LLM reasoning.
 * Falls back to keyword matching if no API key or LLM fails.
 */
export async function routeMessage(text: string): Promise<{ handler: SkillHandler; name: string } | null> {
  // Try LLM-based routing first
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    try {
      if (!anthropic) {
        anthropic = new Anthropic({ apiKey })
      }

      const skillList = routes
        .map(r => `- ${r.name}: ${r.description}`)
        .join('\n')

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{ role: 'user', content: text }],
        system: `You are a skill router. Given a user message, respond with ONLY the skill name that best matches. Available skills:\n${skillList}\n\nRespond with just the skill name, nothing else. If no skill matches, respond with "none".`,
      })

      const skillName = (response.content[0] as { text: string }).text.trim().toLowerCase()

      const match = routes.find(r => r.name === skillName)
      if (match) {
        return { handler: match.handler, name: match.name }
      }
    } catch (err) {
      console.warn(`LLM routing failed, falling back to keywords: ${err}`)
    }
  }

  // Fallback: keyword matching
  const lower = text.toLowerCase()
  for (const route of routes) {
    for (const keyword of route.keywords) {
      if (lower.includes(keyword)) {
        return { handler: route.handler, name: route.name }
      }
    }
  }

  return null
}
