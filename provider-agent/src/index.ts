import express from 'express'
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server'
import { A2AExpressApp } from '@a2a-js/sdk/server/express'
import { agentCard } from './agent-card.js'
import { TravelExecutor } from './executor.js'

const PORT = process.env.PORT ?? 3000

const executor = new TravelExecutor()
const taskStore = new InMemoryTaskStore()
const requestHandler = new DefaultRequestHandler(agentCard, taskStore, executor)

const a2aApp = new A2AExpressApp(requestHandler)
const app = a2aApp.setupRoutes(express())

app.listen(PORT, () => {
  console.log(`Travel Provider running on http://localhost:${PORT}`)
  console.log(`Agent card: http://localhost:${PORT}/.well-known/agent-card.json`)
  console.log(`Skills: ${agentCard.skills?.map(s => s.id).join(', ')}`)
})
