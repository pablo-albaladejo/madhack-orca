# Orca — Platform Research

> **Last updated:** 2026-03-17

## What is Orca?

**Orca** is an enterprise AI agent platform. It positions itself as enabling organizations to "construct your internal AI labor force" — custom AI agents with enterprise-grade security, GDPR compliance, and built-in guardrails.

- **Main site:** <https://orcaplatform.ai/> (also <https://orcaplatform.ai/es/> in Spanish)
- **Status:** Website is marketing-only — no public technical docs as of March 2026.

> **Important:** No public SDK, API docs, CLI, or GitHub repos were found for Orca as of March 2026. The hackathon promises a "starter boilerplate repo with Orca integration" will be provided at the event (March 18).

## Platform Features (from orcaplatform.ai)

- **Custom AI agent development and deployment**
- **Enterprise security**: GDPR compliance, built-in guardrails, data stays under user control
- **Integrations**: Slack, WhatsApp, CRM systems, databases — "one click" connectors
- **Deployment**: Sandbox (free, no credit card) → stack integration → production with auto-scaling
- **Pricing**: Token-based ("pay for what you use"), no per-seat licensing
- **Demo request**: <https://orcaplatform.ai/es/registration>

---

## A2A (Agent-to-Agent) Protocol

The hackathon uses the **A2A protocol** — the core technology for consumer/provider agent communication.

### Overview

- Open protocol by Google, donated to the Linux Foundation
- Enables communication between AI agents built on different frameworks
- Complementary to MCP: **MCP = agent-to-tool**, **A2A = agent-to-agent**
- Spec: <https://a2a-protocol.org/latest/specification/>
- GitHub: <https://github.com/a2aproject/A2A>

### Architecture

- **Client/Consumer Agent:** Initiates tasks and requests
- **Server/Provider Agent:** Executes tasks and provides capabilities
- **Agent Card:** JSON metadata at `/.well-known/agent-card.json` describing agent identity, capabilities, skills, and endpoints
- **Communication:** JSON-RPC over HTTPS (also supports gRPC and HTTP+JSON/REST)
- **Task Lifecycle:** `working` → `input-required` / `auth-required` → `completed` / `failed` / `canceled`

### Agent Card Example (Python)

```python
from a2a.types import AgentCapabilities, AgentCard, AgentSkill

skill = AgentSkill(
    id='hello_world',
    name='Returns hello world',
    description='just returns hello world',
    tags=['hello world'],
    examples=['hi', 'hello world'],
)

agent_card = AgentCard(
    name='Hello World Agent',
    description='Just a hello world agent',
    url='http://localhost:9999/',
    version='1.0.0',
    default_input_modes=['text'],
    default_output_modes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
)
```

---

## SDKs & Libraries

### Official Python SDK

- `pip install a2a-sdk` (or `uv add a2a-sdk`)
- GitHub: <https://github.com/a2aproject/a2a-python>
- API Docs: <https://a2a-protocol.org/latest/sdk/python/api/>
- Tutorial: <https://a2a-protocol.org/latest/tutorials/python/1-introduction/>

### Official JavaScript SDK

- `npm install @a2a-js/sdk`
- GitHub: <https://github.com/a2aproject/a2a-js>
- Supports JSON-RPC, HTTP+JSON/REST, and gRPC transports

### Community Python Library (simpler)

- `pip install python-a2a`
- GitHub: <https://github.com/themanojdesai/python-a2a>
- Includes AgentNetwork, AIAgentRouter, Flow engine, streaming, LangChain integration

---

## Code Examples

### Consumer Agent (Client) — Python

```python
from a2a.client import A2AClient, A2ACardResolver
import httpx

async with httpx.AsyncClient() as httpx_client:
    resolver = A2ACardResolver(httpx_client=httpx_client, base_url='http://localhost:9999')
    # Resolver fetches /.well-known/agent-card.json automatically

    client = A2AClient(httpx_client=httpx_client, agent_card=agent_card)
    request = SendMessageRequest(
        id=str(uuid4()),
        params=MessageSendParams(message={
            'role': 'user',
            'parts': [{'kind': 'text', 'text': 'Plan a trip to Madrid'}],
            'messageId': uuid4().hex,
        })
    )
    response = await client.send_message(request)
```

### Provider Agent (Server) — Python

```python
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore

request_handler = DefaultRequestHandler(
    agent_executor=MyAgentExecutor(),  # Your logic here
    task_store=InMemoryTaskStore(),
)

server = A2AStarletteApplication(
    agent_card=agent_card,
    http_handler=request_handler,
)

uvicorn.run(server.build(), host='0.0.0.0', port=9999)
```

### Provider Agent (Server) — JavaScript/Node.js

```typescript
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { jsonRpcHandler, UserBuilder } from '@a2a-js/sdk/server/express';

const handler = new DefaultRequestHandler(agentCard, new InMemoryTaskStore(), executor);
app.use('/a2a/jsonrpc', jsonRpcHandler({
    requestHandler: handler,
    userBuilder: UserBuilder.noAuthentication
}));
app.listen(4000);
```

---

## Key Resources

| Resource | URL |
|----------|-----|
| A2A Protocol Spec | <https://a2a-protocol.org/latest/specification/> |
| A2A Python Tutorial | <https://a2a-protocol.org/latest/tutorials/python/1-introduction/> |
| A2A JS SDK Tutorial | <https://a2aprotocol.ai/blog/a2a-javascript-sdk> |
| Google Codelab (Consumer/Provider) | <https://codelabs.developers.google.com/intro-a2a-purchasing-concierge> |
| python-a2a (simple library) | <https://github.com/themanojdesai/python-a2a> |
| A2A Samples Repo | <https://github.com/a2aproject/a2a-samples> |
| A2A + LangGraph + CrewAI | <https://heemeng.medium.com/playing-around-with-a2a-langgraph-crewai-0f47d9414eb6> |
| Agent Discovery | <https://a2a-protocol.org/latest/topics/agent-discovery/> |
| A2A + MCP Guide | <https://github.com/a2aproject/A2A/blob/main/docs/topics/a2a-and-mcp.md> |
| IBM A2A Tutorial | <https://www.ibm.com/think/tutorials/use-a2a-protocol-for-ai-agent-communication> |
| Oracle A2A + LangChain RAG | <https://blogs.oracle.com/developers/build-a-scalable-multi-agent-rag-system-with-a2a-protocol-and-langchain> |

---

## Known Gaps

- **No public SDK, CLI, or API docs** — orcaplatform.ai has zero developer-facing documentation
- **No public GitHub repos** for Orca source code or boilerplate
- **No mention of A2A protocol** on the Orca website — the A2A integration is hackathon-specific
- The hackathon will provide a **starter boilerplate repo** at the event (March 18, 19:00)
- **Nomu Labs** (<https://www.nomulabs.com/en>) is a Madrid-based product studio co-organizing the hackathon

## Hackathon Integration Strategy

Since Orca's technical surface is unknown until the event:

1. **Build A2A-compliant agents first** — clean agent card, standard JSON-RPC, proper skill metadata
2. **Keep agent card config-driven** — easy to adapt fields if Orca requires specific format
3. **First 15 minutes of hackathon**: read Orca boilerplate, assess integration requirements
4. **Assumption**: Orca will discover agents via their `/.well-known/agent-card.json` — this is the A2A standard and the most likely integration point
