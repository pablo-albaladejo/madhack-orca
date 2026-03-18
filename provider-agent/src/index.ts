import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import express from 'express'
import cors from 'cors'
import { InMemoryTaskStore, DefaultRequestHandler } from '@a2a-js/sdk/server'
import { A2AExpressApp } from '@a2a-js/sdk/server/express'

import { agentCard } from './agent-card.js'
import { TravelAgentExecutor } from './executor.js'
import { registerSkill } from './router.js'

// Skills
import { weatherHandler } from './skills/weather.js'
import { flightsHandler } from './skills/flights.js'
import { hotelsHandler } from './skills/hotels.js'
import { restaurantsHandler } from './skills/restaurants.js'
import { activitiesHandler } from './skills/activities.js'
import { eventsHandler } from './skills/events.js'

// Load .env — try local first (Railway), then parent directory (local dev)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '../.env') })
config({ path: resolve(__dirname, '../../.env') })

// Register skills with router (LLM uses descriptions, keywords are fallback)
registerSkill('weather', ['weather', 'forecast', 'clima', 'temperature', 'rain', 'sunny'], weatherHandler, 'Weather forecasts for cities (temperature, rain, wind)')
registerSkill('flights', ['flight', 'flights', 'vuelo', 'fly', 'airplane', 'book flight'], flightsHandler, 'Flight search between cities with prices, and flight booking')
registerSkill('hotels', ['hotel', 'hotels', 'accommodation', 'book hotel', 'cancel hotel', 'booking', 'hostel', 'stay'], hotelsHandler, 'Hotel search, booking, and cancellation')
registerSkill('restaurants', ['restaurant', 'restaurants', 'food', 'dining', 'eat', 'comer', 'comida'], restaurantsHandler, 'Restaurant search with ratings and cuisine types')
registerSkill('activities', ['activit', 'museum', 'attraction', 'tours', 'things to do', 'sightseeing', 'visit', 'que hacer'], activitiesHandler, 'Museums, tourist attractions, tours, and things to do')
registerSkill('events', ['event', 'events', 'concert', 'show', 'teatro', 'espectaculo', 'match', 'ticket'], eventsHandler, 'Upcoming events, concerts, sports matches, and theatre shows')

// ANSI colors
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

// Create A2A server
const taskStore = new InMemoryTaskStore()
const agentExecutor = new TravelAgentExecutor()
const requestHandler = new DefaultRequestHandler(agentCard, taskStore, agentExecutor)

const appBuilder = new A2AExpressApp(requestHandler)
const app = appBuilder.setupRoutes(express())

// Enable CORS for consumer agent
app.use(cors())

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`\n${GREEN}Travel Provider Agent running${RESET}`)
  console.log(`${CYAN}  Server:${RESET}     http://localhost:${PORT}`)
  console.log(`${CYAN}  Agent Card:${RESET}  http://localhost:${PORT}/.well-known/agent-card.json`)
  console.log(`${CYAN}  JSON-RPC:${RESET}    http://localhost:${PORT}/`)
  console.log(`${DIM}`)
  console.log(`  Skills:`)
  for (const skill of agentCard.skills) {
    console.log(`    - ${skill.name} (${skill.id})`)
  }
  console.log(`${RESET}`)

  // Log API key status
  const keys = {
    OPENWEATHER_API_KEY: !!process.env.OPENWEATHER_API_KEY,
    GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
    SERPAPI_API_KEY: !!process.env.SERPAPI_API_KEY,
    TICKETMASTER_API_KEY: !!process.env.TICKETMASTER_API_KEY,
  }
  console.log(`${DIM}  API Keys:`)
  for (const [key, present] of Object.entries(keys)) {
    console.log(`    ${present ? GREEN + '>' : '\x1b[33m-'} ${key}: ${present ? 'loaded' : 'missing (using mock data)'}${RESET}`)
  }
  console.log()
})
