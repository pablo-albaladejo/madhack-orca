import { v4 as uuidv4 } from 'uuid'
import type {
  Task,
  Message,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from '@a2a-js/sdk'
import type {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from '@a2a-js/sdk/server'
import { routeMessage } from './router.js'

// ANSI colors for console logging
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

export class TravelAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>()

  async cancelTask(taskId: string, _eventBus: ExecutionEventBus): Promise<void> {
    this.cancelledTasks.add(taskId)
  }

  async execute(ctx: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userMessage = ctx.userMessage
    const existingTask = ctx.task
    const taskId = existingTask?.id || uuidv4()
    const contextId = userMessage.contextId || existingTask?.contextId || uuidv4()

    // Extract text from message parts
    const userText = userMessage.parts
      .filter((p): p is { kind: 'text'; text: string } => p.kind === 'text')
      .map(p => p.text)
      .join(' ')

    console.log(`\n${DIM}---${RESET}`)
    console.log(`${CYAN}[A2A]${RESET} Received: "${userText.substring(0, 80)}${userText.length > 80 ? '...' : ''}"`)
    console.log(`${DIM}      taskId: ${taskId}${RESET}`)
    console.log(`${DIM}      contextId: ${contextId}${RESET}`)

    // Publish initial Task if new
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

    // Publish "working" status
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

    // Route to skill handler
    const match = routeMessage(userText)

    if (!match) {
      console.log(`${YELLOW}[A2A]${RESET} No skill matched, returning help message`)

      const helpText = 'I can help with travel planning! Try asking about:\n' +
        '- Weather forecasts (e.g., "weather in Barcelona")\n' +
        '- Flights (e.g., "flights from Madrid to Barcelona on Friday")\n' +
        '- Hotels (e.g., "hotels in Barcelona" or "book Hotel Gotic")\n' +
        '- Restaurants (e.g., "restaurants in Madrid")\n' +
        '- Activities (e.g., "things to do in Lisbon")'

      const agentMessage: Message = {
        kind: 'message',
        role: 'agent',
        messageId: uuidv4(),
        parts: [{ kind: 'text', text: helpText }],
        taskId,
        contextId,
      }

      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId,
        status: {
          state: 'completed',
          message: agentMessage,
          timestamp: new Date().toISOString(),
        },
        final: true,
      } as TaskStatusUpdateEvent)

      return
    }

    console.log(`${CYAN}[A2A]${RESET} Routing to skill: ${CYAN}${match.name}${RESET}`)

    try {
      // Execute the skill
      const result = await match.handler(userText)

      console.log(`${GREEN}[A2A]${RESET} Skill ${GREEN}${match.name}${RESET} completed`)

      // Publish artifact with data
      eventBus.publish({
        kind: 'artifact-update',
        taskId,
        contextId,
        artifact: {
          artifactId: uuidv4(),
          parts: [
            { kind: 'text', text: result.text },
            { kind: 'data', data: result.data },
          ],
          name: `${match.name}_result`,
        },
      } as TaskArtifactUpdateEvent)

      // Publish completed status
      const agentMessage: Message = {
        kind: 'message',
        role: 'agent',
        messageId: uuidv4(),
        parts: [{ kind: 'text', text: result.text }],
        taskId,
        contextId,
      }

      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId,
        status: {
          state: 'completed',
          message: agentMessage,
          timestamp: new Date().toISOString(),
        },
        final: true,
      } as TaskStatusUpdateEvent)
    } catch (err) {
      console.error(`${RED}[A2A]${RESET} Skill ${match.name} failed:`, err)

      const errorMessage: Message = {
        kind: 'message',
        role: 'agent',
        messageId: uuidv4(),
        parts: [{ kind: 'text', text: `Sorry, there was an error processing your ${match.name} request. Please try again.` }],
        taskId,
        contextId,
      }

      eventBus.publish({
        kind: 'status-update',
        taskId,
        contextId,
        status: {
          state: 'failed',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        final: true,
      } as TaskStatusUpdateEvent)
    }
  }
}
