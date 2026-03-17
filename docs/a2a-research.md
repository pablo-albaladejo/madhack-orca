# A2A (Agent-to-Agent) Protocol: Exhaustive Deep Research

## Table of Contents
1. [Protocol Specification](#1-protocol-specification)
2. [Python SDK (a2a-sdk)](#2-python-sdk-a2a-sdk)
3. [JavaScript SDK (@a2a-js/sdk)](#3-javascript-sdk-a2a-jssdk)
4. [Practical Examples](#4-practical-examples)
5. [Agent Discovery](#5-agent-discovery)
6. [A2A + MCP Relationship](#6-a2a--mcp-relationship)
7. [A2A + LangGraph Integration](#7-a2a--langgraph-integration)
8. [Travel API Examples with A2A](#8-travel-api-examples-with-a2a)
9. [Implementation Patterns for Hackathon](#9-implementation-patterns-for-hackathon)

---

## 1. Protocol Specification

### 1.1 Overview

A2A (Agent-to-Agent) is a layered protocol for inter-agent communication:
- **Layer 1**: Canonical data model (protocol-agnostic structures)
- **Layer 2**: Abstract operations (binding-independent capabilities)
- **Layer 3**: Protocol bindings (JSON-RPC, gRPC, HTTP/REST)

**Current Spec Version**: v0.3.0

### 1.2 JSON-RPC Methods (Exact Method Strings)

| Method | Description | Streaming? |
|--------|-------------|-----------|
| `message/send` | Send a message, returns Task or Message | No |
| `message/stream` | Send a message with SSE streaming | Yes |
| `tasks/get` | Get task state with optional history | No |
| `tasks/cancel` | Request task cancellation | No |
| `tasks/resubscribe` | Re-subscribe to a task's SSE stream | Yes |
| `tasks/pushNotificationConfig/set` | Configure push notification webhook | No |
| `tasks/pushNotificationConfig/get` | Get push notification config | No |
| `tasks/pushNotificationConfig/list` | List all push configs for a task | No |
| `tasks/pushNotificationConfig/delete` | Delete a push config | No |
| `agent/getAuthenticatedExtendedCard` | Get the authenticated extended agent card | No |

### 1.3 Task Lifecycle States

```
TaskState = "submitted" | "working" | "input-required" | "completed"
          | "canceled" | "failed" | "rejected" | "auth-required" | "unknown"
```

**Terminal states**: `completed`, `canceled`, `failed`, `rejected`
**Interrupted states**: `input-required`, `auth-required`
**In-progress state**: `working`
**Initial state**: `submitted`

**Typical flow**:
```
submitted -> working -> completed
submitted -> working -> input-required -> working -> completed
submitted -> working -> failed
submitted -> rejected
submitted -> working -> canceled
```

### 1.4 Core Data Model

#### Task
```json
{
  "id": "string (UUID)",
  "contextId": "string (UUID, optional - links multi-turn conversations)",
  "status": {
    "state": "TaskState",
    "message": "Message (optional)",
    "timestamp": "ISO 8601 string"
  },
  "history": ["Message[]"],
  "artifacts": ["Artifact[]"],
  "metadata": {}
}
```

#### Message
```json
{
  "kind": "message",
  "role": "user | agent",
  "parts": ["Part[]"],
  "messageId": "string (UUID)",
  "taskId": "string (optional)",
  "contextId": "string (optional)",
  "referenceTaskIds": ["string[] (optional)"],
  "metadata": {}
}
```

#### Part (Discriminated Union)
```typescript
// TextPart
{ "kind": "text", "text": "string" }

// FilePart
{ "kind": "file", "file": { "name": "string", "mimeType": "string", "uri": "string" | "bytes": "base64" } }

// DataPart
{ "kind": "data", "data": { /* arbitrary JSON */ } }
```

#### Artifact
```json
{
  "artifactId": "string",
  "name": "string (optional)",
  "description": "string (optional)",
  "parts": ["Part[]"],
  "metadata": {}
}
```

### 1.5 Agent Card (/.well-known/agent-card.json)

```json
{
  "name": "string",
  "description": "string",
  "url": "string (service endpoint URL)",
  "version": "string",
  "protocolVersion": "string (optional)",
  "provider": {
    "organization": "string",
    "url": "string"
  },
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "securitySchemes": {
    "apiKey": { "type": "apiKey", "name": "X-API-Key", "in": "header" },
    "bearerAuth": { "type": "http", "scheme": "bearer" },
    "oauth2": { "type": "oauth2", "flows": {} },
    "openIdConnect": { "type": "openIdConnect", "openIdConnectUrl": "..." },
    "mutualTLS": { "type": "mutualTLS" }
  },
  "security": [{ "apiKey": [] }],
  "defaultInputModes": ["text", "text/plain"],
  "defaultOutputModes": ["text", "text/plain"],
  "skills": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "tags": ["string[]"],
      "examples": ["string[]"],
      "inputModes": ["string[] (optional)"],
      "outputModes": ["string[] (optional)"]
    }
  ],
  "supportsAuthenticatedExtendedCard": false
}
```

### 1.6 JSON-RPC Request/Response Format

**Request (message/send)**:
```json
{
  "jsonrpc": "2.0",
  "id": "request-id-1",
  "method": "message/send",
  "params": {
    "message": {
      "kind": "message",
      "role": "user",
      "messageId": "uuid",
      "parts": [{ "kind": "text", "text": "Hello" }],
      "contextId": "optional-context-id",
      "taskId": "optional-task-id"
    },
    "configuration": {
      "acceptedOutputModes": ["text/plain"],
      "blocking": true,
      "historyLength": 10,
      "pushNotificationConfig": null
    },
    "metadata": {}
  }
}
```

**Success Response (returns Task or Message)**:
```json
{
  "jsonrpc": "2.0",
  "id": "request-id-1",
  "result": {
    "id": "task-uuid",
    "contextId": "context-uuid",
    "status": { "state": "completed", "timestamp": "..." },
    "artifacts": [...],
    "history": [...]
  }
}
```

### 1.7 Streaming (SSE)

For `message/stream`, the server returns Server-Sent Events. Each event is a JSON-RPC response wrapping one of:
- `Task` (initial task created)
- `TaskStatusUpdateEvent` (status changes)
- `TaskArtifactUpdateEvent` (artifact chunks)
- `Message` (direct message response)

**TaskStatusUpdateEvent**:
```json
{
  "kind": "status-update",
  "taskId": "string",
  "contextId": "string",
  "status": {
    "state": "working",
    "message": { "kind": "message", "role": "agent", ... },
    "timestamp": "ISO 8601"
  },
  "final": false
}
```

**TaskArtifactUpdateEvent**:
```json
{
  "kind": "artifact-update",
  "taskId": "string",
  "contextId": "string",
  "artifact": {
    "artifactId": "string",
    "name": "string",
    "parts": [{ "kind": "text", "text": "chunk..." }]
  },
  "append": false,
  "lastChunk": true
}
```

### 1.8 Error Codes

| Error Type | Code |
|-----------|------|
| `JSONParseError` | -32700 |
| `InvalidRequestError` | -32600 |
| `MethodNotFoundError` | -32601 |
| `InvalidParamsError` | -32602 |
| `InternalError` | -32603 |
| `TaskNotFoundError` | A2A-specific |
| `TaskNotCancelableError` | A2A-specific |
| `PushNotificationNotSupportedError` | A2A-specific |
| `UnsupportedOperationError` | A2A-specific |
| `ContentTypeNotSupportedError` | A2A-specific |
| `InvalidAgentResponseError` | A2A-specific |
| `AuthenticatedExtendedCardNotConfiguredError` | A2A-specific |

### 1.9 Well-Known Paths

| Path | Purpose |
|------|---------|
| `/.well-known/agent-card.json` | Public agent card (current) |
| `/.well-known/agent.json` | Deprecated agent card path |
| `/agent/authenticatedExtendedCard` | Authenticated extended card |
| `/` | Default JSON-RPC endpoint |

---

## 2. Python SDK (a2a-sdk)

### 2.1 Installation

```bash
pip install a2a-sdk                    # Core only
pip install "a2a-sdk[http-server]"     # With Starlette/SSE server
pip install "a2a-sdk[all]"             # Everything
pip install "a2a-sdk[grpc]"            # gRPC support
pip install "a2a-sdk[telemetry]"       # OpenTelemetry
```

**Requires**: Python 3.10+

### 2.2 Key Classes and Their Locations

#### Server-Side Classes

**`AgentExecutor`** (`a2a.server.agent_execution.agent_executor`)
```python
from abc import ABC, abstractmethod
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue

class AgentExecutor(ABC):
    @abstractmethod
    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        """Process request and publish events to the queue."""

    @abstractmethod
    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        """Cancel an ongoing task."""
```

**`RequestContext`** (`a2a.server.agent_execution.context`)
```python
class RequestContext:
    def __init__(self,
        request: MessageSendParams | None = None,
        task_id: str | None = None,
        context_id: str | None = None,
        task: Task | None = None,
        related_tasks: list[Task] | None = None,
        call_context: ServerCallContext | None = None,
    ): ...

    def get_user_input(self, delimiter: str = '\n') -> str: ...

    @property
    def message(self) -> Message | None: ...
    @property
    def current_task(self) -> Task | None: ...
    @property
    def task_id(self) -> str | None: ...
    @property
    def context_id(self) -> str | None: ...
    @property
    def configuration(self) -> MessageSendConfiguration | None: ...
    @property
    def metadata(self) -> dict[str, Any]: ...
```

**`EventQueue`** (`a2a.server.events.event_queue`)
```python
Event = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent

class EventQueue:
    async def enqueue_event(self, event: Event) -> None: ...
    async def dequeue_event(self, no_wait: bool = False) -> Event: ...
    def tap(self) -> 'EventQueue': ...
    async def close(self, immediate: bool = False) -> None: ...
```

**`DefaultRequestHandler`** (`a2a.server.request_handlers.default_request_handler`)
```python
class DefaultRequestHandler(RequestHandler):
    def __init__(self,
        agent_executor: AgentExecutor,
        task_store: TaskStore,
        queue_manager: QueueManager | None = None,
        push_config_store: PushNotificationConfigStore | None = None,
        push_sender: PushNotificationSender | None = None,
        request_context_builder: RequestContextBuilder | None = None,
    ): ...
```

**`InMemoryTaskStore`** (`a2a.server.tasks.inmemory_task_store`)
```python
class InMemoryTaskStore(TaskStore):
    async def save(self, task: Task, context: ServerCallContext | None = None) -> None: ...
    async def get(self, task_id: str, context: ServerCallContext | None = None) -> Task | None: ...
    async def delete(self, task_id: str, context: ServerCallContext | None = None) -> None: ...
```

**`A2AStarletteApplication`** (`a2a.server.apps.jsonrpc.starlette_app`)
```python
class A2AStarletteApplication(JSONRPCApplication):
    def __init__(self,
        agent_card: AgentCard,
        http_handler: RequestHandler,
        extended_agent_card: AgentCard | None = None,
        context_builder: CallContextBuilder | None = None,
        card_modifier: Callable | None = None,
        extended_card_modifier: Callable | None = None,
        max_content_length: int | None = 10 * 1024 * 1024,
    ): ...

    def build(self, **kwargs) -> Starlette: ...
    def routes(self) -> list[Route]: ...
    def add_routes_to_app(self, app: Starlette) -> None: ...
```

**`TaskUpdater`** (`a2a.server.tasks.task_updater`) - VERY USEFUL helper:
```python
class TaskUpdater:
    def __init__(self, event_queue: EventQueue, task_id: str, context_id: str): ...

    async def update_status(self, state: TaskState, message: Message | None = None, final: bool = False) -> None: ...
    async def add_artifact(self, parts: list[Part], artifact_id: str | None = None, name: str | None = None) -> None: ...
    async def complete(self, message: Message | None = None) -> None: ...
    async def failed(self, message: Message | None = None) -> None: ...
    async def reject(self, message: Message | None = None) -> None: ...
    async def submit(self, message: Message | None = None) -> None: ...
    async def start_work(self, message: Message | None = None) -> None: ...
    async def cancel(self, message: Message | None = None) -> None: ...
    async def requires_input(self, message: Message | None = None, final: bool = False) -> None: ...
    def new_agent_message(self, parts: list[Part]) -> Message: ...
```

#### Client-Side Classes

**`A2ACardResolver`** (`a2a.client.card_resolver`)
```python
class A2ACardResolver:
    def __init__(self,
        httpx_client: httpx.AsyncClient,
        base_url: str,
        agent_card_path: str = '/.well-known/agent-card.json',
    ): ...

    async def get_agent_card(self,
        relative_card_path: str | None = None,
        http_kwargs: dict | None = None,
        signature_verifier: Callable | None = None,
    ) -> AgentCard: ...
```

**`A2AClient`** (Legacy) (`a2a.client.legacy`)
```python
class A2AClient:
    def __init__(self, httpx_client: httpx.AsyncClient, agent_card: AgentCard): ...

    async def send_message(self, request: SendMessageRequest) -> SendMessageResponse: ...
    def send_message_streaming(self, request: SendStreamingMessageRequest) -> AsyncIterator: ...
```

**`Client`** (New) (`a2a.client.client`) - Preferred API:
```python
class Client(ABC):
    async def send_message(self, request: Message, **kwargs) -> AsyncIterator[ClientEvent | Message]: ...
```

**`ClientFactory`** (`a2a.client.client_factory`)
```python
class ClientFactory:
    def __init__(self, config: ClientConfig, consumers: list[Consumer] | None = None): ...
    def create(self, card: AgentCard, ...) -> Client: ...

class ClientConfig:
    streaming: bool = True
    polling: bool = False
    httpx_client: httpx.AsyncClient | None = None
    supported_transports: list[TransportProtocol | str] = []
    accepted_output_modes: list[str] = []
```

#### Utility Functions

```python
from a2a.utils import (
    # Message helpers
    new_agent_text_message,    # Create agent Message with TextPart
    new_agent_parts_message,   # Create agent Message with list of Parts
    get_message_text,          # Extract text from a Message

    # Task helpers
    new_task,                  # Create new Task from Message
    completed_task,            # Create completed Task with artifacts

    # Artifact helpers
    new_artifact,              # Create Artifact with Parts
    new_text_artifact,         # Create Artifact with TextPart
    new_data_artifact,         # Create Artifact with DataPart
    get_artifact_text,         # Extract text from Artifact

    # Part helpers
    get_text_parts,            # Get text strings from Parts list
    get_data_parts,            # Get data dicts from Parts list
    get_file_parts,            # Get file parts from Parts list

    # Other
    create_task_obj,           # Create Task from MessageSendParams
    build_text_artifact,       # Build simple text artifact
    append_artifact_to_task,   # Add artifact to task
)

from a2a.client import create_text_message_object  # Create user Message with text

# Constants
from a2a.utils import (
    AGENT_CARD_WELL_KNOWN_PATH,    # '/.well-known/agent-card.json'
    EXTENDED_AGENT_CARD_PATH,       # '/agent/authenticatedExtendedCard'
    DEFAULT_RPC_URL,                # '/'
)
```

#### Types (Pydantic Models)

```python
from a2a.types import (
    # Core Models
    AgentCard, AgentSkill, AgentCapabilities,
    Task, TaskState, TaskStatus,
    Message, Part, TextPart, FilePart, DataPart,
    Artifact, Role,

    # Events
    TaskStatusUpdateEvent, TaskArtifactUpdateEvent,

    # Request/Response
    SendMessageRequest, SendStreamingMessageRequest,
    MessageSendParams, MessageSendConfiguration,
    SendMessageResponse, SendMessageSuccessResponse,
    GetTaskRequest, GetTaskResponse,
    CancelTaskRequest, CancelTaskResponse,
    TaskQueryParams, TaskIdParams,

    # Push Notifications
    PushNotificationConfig, TaskPushNotificationConfig,

    # Errors
    InternalError, InvalidParamsError, TaskNotFoundError,
    UnsupportedOperationError, TaskNotCancelableError,

    # Transport
    TransportProtocol,  # "JSONRPC" | "GRPC" | "HTTP+JSON"
)
```

### 2.3 Complete Server Example (Provider Agent in Python)

```python
# __main__.py
import uvicorn
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill

from agent_executor import MyAgentExecutor

skill = AgentSkill(
    id='my_skill',
    name='My Skill Name',
    description='Description of what this agent does',
    tags=['tag1', 'tag2'],
    examples=['Example query 1', 'Example query 2'],
)

agent_card = AgentCard(
    name='My Agent',
    description='Agent description',
    url='http://localhost:10000/',
    version='1.0.0',
    default_input_modes=['text'],
    default_output_modes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
)

request_handler = DefaultRequestHandler(
    agent_executor=MyAgentExecutor(),
    task_store=InMemoryTaskStore(),
)

server = A2AStarletteApplication(
    agent_card=agent_card,
    http_handler=request_handler,
)

uvicorn.run(server.build(), host='0.0.0.0', port=10000)
```

```python
# agent_executor.py
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import (
    Part, TextPart, TaskState,
    TaskStatusUpdateEvent, TaskArtifactUpdateEvent,
)
from a2a.utils import new_agent_text_message, new_task, new_text_artifact

class MyAgentExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        query = context.get_user_input()
        task = context.current_task

        # Create task if new
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)

        # Use TaskUpdater for convenience
        updater = TaskUpdater(event_queue, task.id, task.context_id)

        # Signal working
        await updater.start_work(
            new_agent_text_message("Processing...", task.context_id, task.id)
        )

        # Do work and stream artifacts
        result = await do_some_work(query)
        await updater.add_artifact(
            [Part(root=TextPart(text=result))],
            name='result',
        )

        # Complete
        await updater.complete()

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise Exception('cancel not supported')
```

### 2.4 Complete Client Example (Consumer Agent in Python)

#### Using Legacy A2AClient (simpler, widely used in examples)
```python
import asyncio
from uuid import uuid4
import httpx
from a2a.client import A2ACardResolver, A2AClient
from a2a.types import (
    AgentCard, MessageSendParams,
    SendMessageRequest, SendStreamingMessageRequest,
)

async def main():
    base_url = 'http://localhost:10000'

    async with httpx.AsyncClient() as httpx_client:
        # 1. Discover agent
        resolver = A2ACardResolver(httpx_client=httpx_client, base_url=base_url)
        agent_card = await resolver.get_agent_card()

        # 2. Create client
        client = A2AClient(httpx_client=httpx_client, agent_card=agent_card)

        # 3. Send message (non-streaming)
        payload = {
            'message': {
                'role': 'user',
                'parts': [{'kind': 'text', 'text': 'Plan a trip to Paris'}],
                'messageId': uuid4().hex,
            },
        }
        request = SendMessageRequest(
            id=str(uuid4()),
            params=MessageSendParams(**payload),
        )
        response = await client.send_message(request)
        print(response.model_dump(mode='json', exclude_none=True))

        # 4. Streaming
        streaming_request = SendStreamingMessageRequest(
            id=str(uuid4()),
            params=MessageSendParams(**payload),
        )
        async for chunk in client.send_message_streaming(streaming_request):
            print(chunk.model_dump(mode='json', exclude_none=True))

        # 5. Multi-turn (use task_id and context_id from previous response)
        task_id = response.root.result.id
        context_id = response.root.result.context_id
        followup = {
            'message': {
                'role': 'user',
                'parts': [{'kind': 'text', 'text': 'What about hotels?'}],
                'messageId': uuid4().hex,
                'taskId': task_id,
                'contextId': context_id,
            },
        }
        followup_request = SendMessageRequest(
            id=str(uuid4()),
            params=MessageSendParams(**followup),
        )
        response2 = await client.send_message(followup_request)

asyncio.run(main())
```

#### Using New ClientFactory API (preferred)
```python
import asyncio
import httpx
from a2a.client import (
    A2ACardResolver, Client, ClientConfig, ClientFactory,
    create_text_message_object,
)
from a2a.types import TransportProtocol
from a2a.utils.message import get_message_text

async def main():
    async with httpx.AsyncClient() as httpx_client:
        resolver = A2ACardResolver(httpx_client=httpx_client, base_url='http://localhost:10000')
        agent_card = await resolver.get_agent_card()

        config = ClientConfig(
            httpx_client=httpx_client,
            supported_transports=[TransportProtocol.jsonrpc],
            streaming=agent_card.capabilities.streaming,
        )
        client = ClientFactory(config).create(agent_card)

        # Send a message (returns async iterator)
        request = create_text_message_object(content='Plan a trip to Tokyo')
        async for response in client.send_message(request):
            task, update_event = response
            if task.artifacts:
                print(get_message_text(task.artifacts[-1]))

asyncio.run(main())
```

---

## 3. JavaScript SDK (@a2a-js/sdk)

### 3.1 Installation

```bash
npm install @a2a-js/sdk
# Peer dependencies for Express:
npm install express @types/express
```

### 3.2 Key Imports

```typescript
// Types (from main package)
import {
  AgentCard, Task, TaskState, TaskStatus,
  TaskStatusUpdateEvent, TaskArtifactUpdateEvent,
  Message, Part, TextPart, FilePart, DataPart,
  MessageSendParams,
} from "@a2a-js/sdk";

// Server classes
import {
  InMemoryTaskStore, TaskStore,
  AgentExecutor, RequestContext, ExecutionEventBus,
  DefaultRequestHandler,
} from "@a2a-js/sdk/server";

// Express integration
import { A2AExpressApp } from "@a2a-js/sdk/server/express";

// Client
import { A2AClient } from "@a2a-js/sdk/client";
```

### 3.3 Server-Side Interfaces

**AgentExecutor** (interface):
```typescript
interface AgentExecutor {
  execute: (requestContext: RequestContext, eventBus: ExecutionEventBus) => Promise<void>;
  cancelTask: (taskId: string, eventBus: ExecutionEventBus) => Promise<void>;
}
```

**RequestContext**:
```typescript
class RequestContext {
  userMessage: Message;       // The incoming user message
  task?: Task;                // Existing task (for multi-turn)
  // taskId, contextId derived from message/task
}
```

**ExecutionEventBus**:
```typescript
interface ExecutionEventBus {
  publish(event: Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent | Message): void;
  finished(): void;
}
```

**TaskStore** (interface):
```typescript
interface TaskStore {
  getTask(taskId: string): Promise<Task | undefined>;
  setTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}
```

**DefaultRequestHandler**:
```typescript
class DefaultRequestHandler {
  constructor(
    agentCard: AgentCard,
    taskStore: TaskStore,
    agentExecutor: AgentExecutor
  );
}
```

### 3.4 Complete TypeScript Provider Agent (Express)

```typescript
// index.ts
import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  AgentCard, Task, TaskState, TaskStatusUpdateEvent, Message
} from "@a2a-js/sdk";
import {
  InMemoryTaskStore, AgentExecutor, RequestContext,
  ExecutionEventBus, DefaultRequestHandler,
} from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";

// 1. Define Agent Card
const agentCard: AgentCard = {
  name: "My TypeScript Agent",
  description: "A provider agent built with Express",
  url: "http://localhost:3000/",
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [{
    id: "my_skill",
    name: "My Skill",
    description: "Does something useful",
    tags: ["example"],
    examples: ["Do the thing"],
    inputModes: ["text"],
    outputModes: ["text"],
  }],
  supportsAuthenticatedExtendedCard: false,
};

// 2. Implement AgentExecutor
class MyAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    this.cancelledTasks.add(taskId);
  }

  async execute(ctx: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userMessage = ctx.userMessage;
    const existingTask = ctx.task;
    const taskId = existingTask?.id || uuidv4();
    const contextId = userMessage.contextId || existingTask?.contextId || uuidv4();

    // Publish initial Task if new
    if (!existingTask) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId: contextId,
        status: { state: "submitted", timestamp: new Date().toISOString() },
        history: [userMessage],
      };
      eventBus.publish(initialTask);
    }

    // Publish "working" status
    eventBus.publish({
      kind: "status-update",
      taskId, contextId,
      status: {
        state: "working",
        message: {
          kind: "message", role: "agent", messageId: uuidv4(),
          parts: [{ kind: "text", text: "Processing..." }],
          taskId, contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    } as TaskStatusUpdateEvent);

    // Do actual work
    const userText = userMessage.parts
      .filter((p): p is { kind: "text"; text: string } => p.kind === "text")
      .map(p => p.text)
      .join(" ");

    const result = await doWork(userText);

    // Publish completed status
    const agentMessage: Message = {
      kind: "message", role: "agent", messageId: uuidv4(),
      parts: [{ kind: "text", text: result }],
      taskId, contextId,
    };

    eventBus.publish({
      kind: "status-update",
      taskId, contextId,
      status: {
        state: "completed",
        message: agentMessage,
        timestamp: new Date().toISOString(),
      },
      final: true,
    } as TaskStatusUpdateEvent);
  }
}

// 3. Wire up Express server
const taskStore = new InMemoryTaskStore();
const agentExecutor = new MyAgentExecutor();
const requestHandler = new DefaultRequestHandler(agentCard, taskStore, agentExecutor);

const appBuilder = new A2AExpressApp(requestHandler);
const app = appBuilder.setupRoutes(express());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agent server running at http://localhost:${PORT}`);
  console.log(`Agent card: http://localhost:${PORT}/.well-known/agent-card.json`);
});
```

### 3.5 TypeScript Client

```typescript
import { A2AClient } from "@a2a-js/sdk/client";
import { MessageSendParams, AgentCard } from "@a2a-js/sdk";
import crypto from "node:crypto";

// Simple client
const client = new A2AClient("http://localhost:3000");

// Or from agent card
const card: AgentCard = await client.getAgentCard();

// Send message (non-streaming)
const params: MessageSendParams = {
  message: {
    messageId: crypto.randomUUID(),
    kind: "message",
    role: "user",
    parts: [{ kind: "text", text: "Hello agent!" }],
  },
};
const response = await client.sendMessage(params);

// Send message (streaming)
const stream = client.sendMessageStream(params);
for await (const event of stream) {
  if (event.kind === "status-update") {
    console.log(`Status: ${event.status.state}`);
    if (event.final) break;
  } else if (event.kind === "artifact-update") {
    console.log(`Artifact: ${event.artifact.parts}`);
  } else if (event.kind === "task") {
    console.log(`Task created: ${event.id}`);
  }
}
```

### 3.6 package.json for TypeScript Provider

```json
{
  "name": "a2a-provider-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "npx tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@a2a-js/sdk": "^0.3.3",
    "express": "^4.21.2",
    "uuid": "^11.0.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.1",
    "@types/node": "^22.13.14",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

---

## 4. Practical Examples

### 4.1 Google Codelab: Purchasing Concierge

**Architecture**: 3-agent system
- **Burger Agent** (CrewAI, Cloud Run) - A2A Server/Provider
- **Pizza Agent** (LangGraph, Cloud Run) - A2A Server/Provider
- **Purchasing Concierge** (ADK, Agent Engine) - A2A Client/Consumer

**Key patterns demonstrated**:

1. **Agent Discovery**: Consumer fetches agent cards from known URLs
```python
card_resolver = A2ACardResolver(base_url=address, httpx_client=httpx_client)
card = await card_resolver.get_agent_card()
```

2. **Sending tasks to remote agents**:
```python
payload = {
    "message": {
        "role": "user",
        "parts": [{"type": "text", "text": task}],
        "messageId": message_id,
        "contextId": session_id,
    }
}
message_request = SendMessageRequest(
    id=message_id,
    params=MessageSendParams.model_validate(payload)
)
response = await client.send_message(message_request=message_request)
```

3. **Server-side executor pattern**:
```python
class BurgerSellerAgentExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        query = context.get_user_input()
        result = self.agent.invoke(query, context.context_id)
        parts = [Part(root=TextPart(text=str(result)))]
        await event_queue.enqueue_event(
            completed_task(context.task_id, context.context_id,
                          [new_artifact(parts, f"burger_{context.task_id}")],
                          [context.message])
        )
```

### 4.2 Samples Repository Structure

Located at `github.com/a2aproject/a2a-samples`:

**Python agents**:
- `helloworld` - Minimal example
- `langgraph` - LangGraph currency conversion agent (with multi-turn)
- `travel_planner_agent` - Travel planning with streaming
- `adk_currency_agent`, `adk_facts` - Google ADK examples
- `crewai` - CrewAI integration
- `airbnb_planner_multiagent` - Multi-agent Airbnb planning
- `content_planner` - Content planning agent
- `birthday_planner_adk` - Birthday planning
- `dice_agent_grpc`, `dice_agent_rest` - gRPC and REST transport examples
- `github-agent` - GitHub integration
- `a2a_mcp` - A2A + MCP integration example

**JS agents**:
- `movie-agent` - Movie search with Genkit + TMDB
- `coder` - Code assistant
- `content-editor` - Content editing agent

---

## 5. Agent Discovery

### 5.1 Three Discovery Strategies

#### Well-Known URI (Primary)
```
GET https://{agent-host}/.well-known/agent-card.json
```
Returns the public `AgentCard` JSON. Follows RFC 8615.

#### Curated Registries
Central service maintains collection of agent cards. Clients query by skills, tags, or provider. No standard API prescribed by spec.

#### Direct Configuration
Hardcoded URLs, config files, or environment variables. Best for development and tightly-coupled systems.

### 5.2 Extended Agent Card
For authenticated users, more detailed capabilities at:
```
GET https://{agent-host}/agent/authenticatedExtendedCard
Authorization: Bearer <token>
```

### 5.3 Discovery Flow in Code

```python
# Python Consumer discovering a Provider
import httpx
from a2a.client import A2ACardResolver

async def discover_agent(base_url: str):
    async with httpx.AsyncClient() as client:
        resolver = A2ACardResolver(httpx_client=client, base_url=base_url)
        card = await resolver.get_agent_card()

        print(f"Agent: {card.name}")
        print(f"Skills: {[s.name for s in card.skills]}")
        print(f"Streaming: {card.capabilities.streaming}")
        print(f"Endpoint: {card.url}")
        return card
```

```typescript
// TypeScript Consumer discovering a Provider
const client = new A2AClient("http://localhost:3000");
const card = await client.getAgentCard();
console.log(`Agent: ${card.name}, Skills: ${card.skills.map(s => s.name)}`);
```

### 5.4 Caching
- Servers should include `Cache-Control` headers with `max-age`
- Include `ETag` headers derived from card version or content hash
- Clients should honor HTTP caching and use conditional requests

---

## 6. A2A + MCP Relationship

### 6.1 Core Distinction
- **MCP (Model Context Protocol)**: Agent-to-tool communication. Structured inputs/outputs for well-defined functions (database, API, calculator).
- **A2A (Agent-to-Agent)**: Peer-to-peer agent collaboration. Complex multi-turn dialogues, shared task management.

### 6.2 When to Use Each
- **MCP**: Accessing discrete, stateless functions (weather API, database query)
- **A2A**: Agent-to-agent interactions with complex, multi-turn dialogues and task management

### 6.3 Working Together
An agentic app might use:
- **A2A** to communicate with other agents
- **MCP** internally within each agent to access tools and resources

**Auto Repair Shop Analogy**:
- Customer talks to Shop Manager via **A2A**
- Manager coordinates with Mechanic agents via **A2A**
- Each Mechanic uses **MCP** to access diagnostic scanners, manuals
- Mechanic uses **A2A** to talk to Parts Supplier agent

### 6.4 Key Insight
> "A2A is about agents _partnering_ on tasks, while MCP is more about agents _using_ capabilities."

---

## 7. A2A + LangGraph Integration

### 7.1 Official LangGraph Sample (Currency Agent)

Located at `a2a-samples/samples/python/agents/langgraph/`

**Dependencies** (`pyproject.toml`):
```
a2a-sdk>=0.3.0
langgraph>=0.3.18
langchain-google-genai>=2.0.10
langchain-openai>=0.1.0
```

**LangGraph Agent** (`agent.py`):
```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

memory = MemorySaver()

@tool
def get_exchange_rate(currency_from: str = 'USD', currency_to: str = 'EUR', currency_date: str = 'latest'):
    """Use this to get current exchange rate."""
    response = httpx.get(f'https://api.frankfurter.app/{currency_date}',
                         params={'from': currency_from, 'to': currency_to})
    return response.json()

class ResponseFormat(BaseModel):
    status: Literal['input_required', 'completed', 'error'] = 'input_required'
    message: str

class CurrencyAgent:
    SYSTEM_INSTRUCTION = 'You are a specialized assistant for currency conversions...'
    FORMAT_INSTRUCTION = 'Set response status to input_required if...'

    def __init__(self):
        self.model = ChatGoogleGenerativeAI(model='gemini-2.0-flash')
        self.tools = [get_exchange_rate]
        self.graph = create_react_agent(
            self.model,
            tools=self.tools,
            checkpointer=memory,  # Enables multi-turn via thread_id
            prompt=self.SYSTEM_INSTRUCTION,
            response_format=(self.FORMAT_INSTRUCTION, ResponseFormat),
        )

    async def stream(self, query, context_id) -> AsyncIterable[dict]:
        inputs = {'messages': [('user', query)]}
        config = {'configurable': {'thread_id': context_id}}  # context_id = thread_id!

        for item in self.graph.stream(inputs, config, stream_mode='values'):
            message = item['messages'][-1]
            if isinstance(message, AIMessage) and message.tool_calls:
                yield {'is_task_complete': False, 'require_user_input': False,
                       'content': 'Looking up the exchange rates...'}
            elif isinstance(message, ToolMessage):
                yield {'is_task_complete': False, 'require_user_input': False,
                       'content': 'Processing the exchange rates..'}

        yield self.get_agent_response(config)
```

**A2A Executor wrapping LangGraph** (`agent_executor.py`):
```python
class CurrencyAgentExecutor(AgentExecutor):
    def __init__(self):
        self.agent = CurrencyAgent()

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        query = context.get_user_input()
        task = context.current_task
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)

        updater = TaskUpdater(event_queue, task.id, task.context_id)

        async for item in self.agent.stream(query, task.context_id):
            is_task_complete = item['is_task_complete']
            require_user_input = item['require_user_input']

            if not is_task_complete and not require_user_input:
                # Intermediate status updates
                await updater.update_status(
                    TaskState.working,
                    new_agent_text_message(item['content'], task.context_id, task.id),
                )
            elif require_user_input:
                # Need more info from user
                await updater.update_status(
                    TaskState.input_required,
                    new_agent_text_message(item['content'], task.context_id, task.id),
                    final=True,
                )
                break
            else:
                # Task complete - add artifact and finish
                await updater.add_artifact(
                    [Part(root=TextPart(text=item['content']))],
                    name='conversion_result',
                )
                await updater.complete()
                break
```

### 7.2 Key Pattern: LangGraph context_id = thread_id

The A2A `context_id` maps directly to LangGraph's `thread_id` for the `MemorySaver` checkpointer. This enables multi-turn conversations:

```python
# A2A context_id is passed as LangGraph thread_id
config = {'configurable': {'thread_id': context_id}}
self.graph.stream(inputs, config, stream_mode='values')
```

### 7.3 Multi-turn Flow

1. Client sends first message (no `contextId`/`taskId`)
2. Server creates task, assigns `taskId` and `contextId`
3. Server returns `input-required` state
4. Client sends follow-up with same `taskId` and `contextId`
5. LangGraph resumes conversation from checkpoint (same `thread_id`)
6. Server returns `completed` state

---

## 8. Travel API Examples with A2A

### 8.1 Travel Planner Agent (Official Sample)

Located at `a2a-samples/samples/python/agents/travel_planner_agent/`

**Server setup** (`__main__.py`):
```python
skill = AgentSkill(
    id='travel_planner',
    name='travel planner agent',
    description='travel planner',
    tags=['travel planner'],
    examples=['hello', 'nice to meet you!'],
)

agent_card = AgentCard(
    name='travel planner Agent',
    description='travel planner',
    url='http://localhost:10001/',
    version='1.0.0',
    default_input_modes=['text'],
    default_output_modes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
)

request_handler = DefaultRequestHandler(
    agent_executor=TravelPlannerAgentExecutor(),
    task_store=InMemoryTaskStore(),
)

server = A2AStarletteApplication(agent_card=agent_card, http_handler=request_handler)
uvicorn.run(server.build(), host='0.0.0.0', port=10001)
```

**Agent with streaming** (`agent.py`):
```python
class TravelPlannerAgent:
    def __init__(self):
        self.model = ChatOpenAI(model='gpt-4o', temperature=0.7)

    async def stream(self, query: str) -> AsyncGenerator[dict, None]:
        messages = [SystemMessage(content="You are an expert travel assistant...")]
        messages.append(HumanMessage(content=query))

        async for chunk in self.model.astream(messages):
            if hasattr(chunk, 'content') and chunk.content:
                yield {'content': chunk.content, 'done': False}
        yield {'content': '', 'done': True}
```

**Executor with streaming artifacts** (`agent_executor.py`):
```python
class TravelPlannerAgentExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        query = context.get_user_input()

        async for event in self.agent.stream(query):
            # Stream artifact chunks
            message = TaskArtifactUpdateEvent(
                context_id=context.context_id,
                task_id=context.task_id,
                artifact=new_text_artifact(name='current_result', text=event['content']),
            )
            await event_queue.enqueue_event(message)
            if event['done']:
                break

        # Signal completion
        status = TaskStatusUpdateEvent(
            context_id=context.context_id,
            task_id=context.task_id,
            status=TaskStatus(state=TaskState.completed),
            final=True,
        )
        await event_queue.enqueue_event(status)
```

### 8.2 Pattern: Wrapping a REST API as A2A Provider

```python
# Pattern for wrapping any REST API (e.g., a flight/hotel booking API)
import httpx

class FlightSearchAgent:
    """Wraps a REST API as an A2A-compatible agent."""

    def __init__(self, api_base_url: str, api_key: str):
        self.api_base = api_base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient()

    async def search_flights(self, origin: str, destination: str, date: str) -> dict:
        response = await self.client.get(
            f"{self.api_base}/flights/search",
            params={"origin": origin, "destination": destination, "date": date},
            headers={"Authorization": f"Bearer {self.api_key}"},
        )
        return response.json()

class FlightSearchExecutor(AgentExecutor):
    def __init__(self):
        self.agent = FlightSearchAgent(api_base_url="...", api_key="...")
        self.llm = ChatOpenAI(model='gpt-4o')

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        query = context.get_user_input()
        task = context.current_task or new_task(context.message)
        if not context.current_task:
            await event_queue.enqueue_event(task)

        updater = TaskUpdater(event_queue, task.id, task.context_id)
        await updater.start_work()

        # Use LLM to extract search params from natural language
        params = await self.llm.ainvoke(f"Extract origin, destination, date from: {query}")

        # Call the actual API
        results = await self.agent.search_flights(
            origin=params.origin,
            destination=params.destination,
            date=params.date,
        )

        # Return results as artifact
        await updater.add_artifact(
            [Part(root=DataPart(data=results))],
            name='flight_results',
        )
        await updater.complete()
```

---

## 9. Implementation Patterns for Hackathon

### 9.1 Architecture: Python Consumer + TypeScript Provider

```
[User] <-> [Python/LangGraph Consumer Agent] <--A2A--> [TypeScript/Express Provider Agent]
                    |                                           |
                Uses LangGraph                          Wraps REST APIs
                for orchestration                       as A2A skills
                    |                                           |
            Discovers provider via                    Serves agent card at
            /.well-known/agent-card.json             /.well-known/agent-card.json
```

### 9.2 Provider Agent (TypeScript/Express) Setup

```bash
mkdir provider-agent && cd provider-agent
npm init -y
npm install @a2a-js/sdk express uuid cors dotenv
npm install -D @types/express @types/node typescript tsx
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### 9.3 Consumer Agent (Python/LangGraph) Setup

```bash
mkdir consumer-agent && cd consumer-agent
python -m venv .venv && source .venv/bin/activate
pip install "a2a-sdk[http-server]" langgraph langchain-openai httpx
```

**Consumer as LangGraph agent with A2A tool**:
```python
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
import httpx
from a2a.client import A2ACardResolver, A2AClient
from a2a.types import MessageSendParams, SendMessageRequest
from uuid import uuid4

# Global client registry
agent_clients: dict[str, A2AClient] = {}

async def discover_and_register_agent(base_url: str, httpx_client: httpx.AsyncClient):
    """Discover a provider agent and register it."""
    resolver = A2ACardResolver(httpx_client=httpx_client, base_url=base_url)
    card = await resolver.get_agent_card()
    client = A2AClient(httpx_client=httpx_client, agent_card=card)
    agent_clients[card.name] = client
    return card

@tool
async def send_to_agent(agent_name: str, message: str) -> str:
    """Send a task to a remote A2A agent.

    Args:
        agent_name: The name of the agent to send to
        message: The message/task to send
    """
    client = agent_clients.get(agent_name)
    if not client:
        return f"Agent '{agent_name}' not found"

    payload = {
        'message': {
            'role': 'user',
            'parts': [{'kind': 'text', 'text': message}],
            'messageId': uuid4().hex,
        },
    }
    request = SendMessageRequest(
        id=str(uuid4()),
        params=MessageSendParams(**payload),
    )
    response = await client.send_message(request)
    result = response.root.result

    # Extract text from response (Task or Message)
    if hasattr(result, 'artifacts') and result.artifacts:
        texts = []
        for artifact in result.artifacts:
            for part in artifact.parts:
                if hasattr(part.root, 'text'):
                    texts.append(part.root.text)
        return '\n'.join(texts)
    elif hasattr(result, 'status') and result.status.message:
        msg = result.status.message
        return '\n'.join(p.root.text for p in msg.parts if hasattr(p.root, 'text'))
    return str(result)

# Create LangGraph agent
model = ChatOpenAI(model='gpt-4o')
consumer_graph = create_react_agent(
    model,
    tools=[send_to_agent],
    prompt="You are an orchestrator agent. You discover and delegate tasks to specialized provider agents.",
)
```

### 9.4 Multi-Turn Conversation Pattern

```python
# Consumer maintains context across turns
class ConversationManager:
    def __init__(self):
        self.sessions: dict[str, dict] = {}  # session_id -> {task_id, context_id}

    async def send_message(self, client: A2AClient, session_id: str, text: str) -> dict:
        session = self.sessions.get(session_id, {})

        payload = {
            'message': {
                'role': 'user',
                'parts': [{'kind': 'text', 'text': text}],
                'messageId': uuid4().hex,
            },
        }

        # Add task_id and context_id for follow-ups
        if 'task_id' in session:
            payload['message']['taskId'] = session['task_id']
            payload['message']['contextId'] = session['context_id']

        request = SendMessageRequest(
            id=str(uuid4()),
            params=MessageSendParams(**payload),
        )
        response = await client.send_message(request)
        result = response.root.result

        # Store task_id and context_id for next turn
        if hasattr(result, 'id'):
            self.sessions[session_id] = {
                'task_id': result.id,
                'context_id': result.context_id,
            }

        return result
```

### 9.5 Streaming Pattern (Consumer reads SSE from Provider)

```python
# Consumer reading streaming response
async def stream_from_provider(client: A2AClient, text: str):
    payload = {
        'message': {
            'role': 'user',
            'parts': [{'kind': 'text', 'text': text}],
            'messageId': uuid4().hex,
        },
    }
    request = SendStreamingMessageRequest(
        id=str(uuid4()),
        params=MessageSendParams(**payload),
    )

    async for chunk in client.send_message_streaming(request):
        data = chunk.model_dump(mode='json', exclude_none=True)
        result = data.get('result', {})

        if result.get('kind') == 'status-update':
            state = result['status']['state']
            print(f"Status: {state}")
            if result.get('final'):
                print("Stream complete")
                break
        elif result.get('kind') == 'artifact-update':
            for part in result['artifact']['parts']:
                if 'text' in part:
                    print(part['text'], end='')
```

### 9.6 Quick Reference: Minimal Working System

**TypeScript Provider** (8 essential lines after imports):
```typescript
const card: AgentCard = { name: "Provider", description: "...", url: "http://localhost:3000/", version: "1.0.0", capabilities: { streaming: false }, skills: [{ id: "s1", name: "Skill" }] };
const handler = new DefaultRequestHandler(card, new InMemoryTaskStore(), myExecutor);
const app = new A2AExpressApp(handler).setupRoutes(express());
app.listen(3000);
```

**Python Consumer** (8 essential lines after imports):
```python
async with httpx.AsyncClient() as hc:
    resolver = A2ACardResolver(httpx_client=hc, base_url='http://localhost:3000')
    card = await resolver.get_agent_card()
    client = A2AClient(httpx_client=hc, agent_card=card)
    req = SendMessageRequest(id=str(uuid4()), params=MessageSendParams(message={'role':'user','parts':[{'kind':'text','text':'hello'}],'messageId':uuid4().hex}))
    resp = await client.send_message(req)
    print(resp.model_dump(mode='json', exclude_none=True))
```

### 9.7 Key Implementation Gotchas

1. **Part structure differs between Python and JS**: In Python, `Part(root=TextPart(text="..."))`. In JS, `{ kind: "text", text: "..." }` directly.

2. **Agent card URL must be the full base URL**: The `url` field in AgentCard should be the full URL where the JSON-RPC endpoint lives (e.g., `http://localhost:3000/`).

3. **contextId enables multi-turn**: Always pass `contextId` (and optionally `taskId`) back for follow-up messages.

4. **TaskUpdater is your friend**: Use it instead of manually creating `TaskStatusUpdateEvent` and `TaskArtifactUpdateEvent`.

5. **Streaming requires `capabilities.streaming: true`** in the agent card.

6. **The default JSON-RPC endpoint is `/`** (root path) in Python. In JS/Express, `A2AExpressApp.setupRoutes()` also mounts at root by default.

7. **Agent card is served at `/.well-known/agent-card.json`** automatically by both `A2AStarletteApplication` and `A2AExpressApp`.

8. **For LangGraph multi-turn**: Map A2A `context_id` to LangGraph `thread_id` in the checkpointer config.

9. **Event types to publish from executor**:
   - `Task` - Only for new task creation
   - `TaskStatusUpdateEvent` - For status changes (working, completed, input-required, etc.)
   - `TaskArtifactUpdateEvent` - For streaming artifact chunks
   - `Message` - For simple message-only responses (no task tracking)

10. **Final flag**: Set `final: true` on the last `TaskStatusUpdateEvent` to signal end of streaming.
