import type { SkillHandler } from './skills/types.js'

interface SkillRoute {
  keywords: string[]
  handler: SkillHandler
  name: string
}

const routes: SkillRoute[] = []

export function registerSkill(name: string, keywords: string[], handler: SkillHandler): void {
  routes.push({ name, keywords, handler })
}

export function routeMessage(text: string): { handler: SkillHandler; name: string } | null {
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
