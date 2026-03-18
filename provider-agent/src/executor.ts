import { v4 as uuidv4 } from 'uuid'
import type {
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from '@a2a-js/sdk'
import type {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from '@a2a-js/sdk/server'
import { getWeather } from './skills/weather.js'
import { searchRestaurants } from './skills/restaurants.js'
import { searchFlights } from './skills/flights.js'
import { searchHotels } from './skills/hotels.js'
import { handleBooking } from './skills/booking.js'

type SkillHandler = (query: string) => Promise<string>

const SKILL_ROUTES: Array<{ keywords: string[]; handler: SkillHandler }> = [
  { keywords: ['weather', 'temperature', 'forecast', 'climate'], handler: getWeather },
  { keywords: ['restaurant', 'food', 'eat', 'dining', 'dinner', 'lunch'], handler: searchRestaurants },
  { keywords: ['flight', 'fly', 'airline', 'plane'], handler: searchFlights },
  { keywords: ['hotel', 'accommodation', 'stay', 'lodging', 'hostel'], handler: searchHotels },
  { keywords: ['book', 'reserve', 'cancel', 'confirmation', 'reservation'], handler: handleBooking },
]

function routeToSkill(text: string): SkillHandler {
  const lower = text.toLowerCase()
  for (const route of SKILL_ROUTES) {
    if (route.keywords.some(kw => lower.includes(kw))) {
      return route.handler
    }
  }
  return async () => 'Available skills: weather, restaurants, flights, hotels, booking. Please specify what you need.'
}

function extractText(message: { parts: Array<{ kind: string; text?: string }> }): string {
  return message.parts
    .filter((p): p is { kind: 'text'; text: string } => p.kind === 'text')
    .map(p => p.text)
    .join(' ')
}

export class TravelExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>()

  async cancelTask(taskId: string, _eventBus: ExecutionEventBus): Promise<void> {
    this.cancelledTasks.add(taskId)
  }

  async execute(ctx: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userMessage = ctx.userMessage
    const existingTask = ctx.task
    const taskId = existingTask?.id ?? uuidv4()
    const contextId = userMessage.contextId ?? existingTask?.contextId ?? uuidv4()

    if (!existingTask) {
      const initialTask: Task = {
        kind: 'task',
        id: taskId,
        contextId,
        status: { state: 'submitted', timestamp: new Date().toISOString() },
        history: [userMessage],
      }
      eventBus.publish(initialTask)
    }

    const userText = extractText(userMessage)
    const handler = routeToSkill(userText)

    eventBus.publish({
      kind: 'status-update',
      taskId,
      contextId,
      status: {
        state: 'working',
        message: {
          kind: 'message',
          role: 'agent',
          messageId: uuidv4(),
          parts: [{ kind: 'text', text: 'Processing your request...' }],
          taskId,
          contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    } as TaskStatusUpdateEvent)

    let result: string
    try {
      result = await handler(userText)
    } catch (err) {
      result = `Error processing request: ${err instanceof Error ? err.message : 'Unknown error'}`
    }

    eventBus.publish({
      kind: 'artifact-update',
      taskId,
      contextId,
      artifact: {
        name: 'result',
        parts: [{ kind: 'text', text: result }],
      },
    } as TaskArtifactUpdateEvent)

    eventBus.publish({
      kind: 'status-update',
      taskId,
      contextId,
      status: {
        state: 'completed',
        message: {
          kind: 'message',
          role: 'agent',
          messageId: uuidv4(),
          parts: [{ kind: 'text', text: result }],
          taskId,
          contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: true,
    } as TaskStatusUpdateEvent)
  }
}
