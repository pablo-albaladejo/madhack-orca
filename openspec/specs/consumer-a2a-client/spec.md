> Synced: 2026-03-17

### Requirement: Consumer discovers provider via Agent Card
The consumer SHALL use `A2ACardResolver` to fetch the provider's Agent Card from a configurable URL (default `http://localhost:3000`), cache it, and extract available skills.

#### Scenario: Successful discovery
- **WHEN** the consumer starts and the provider is running at localhost:3000
- **THEN** the consumer fetches `/.well-known/agent-card.json`, caches the card, and registers skills as tools

### Requirement: Consumer sends A2A messages to provider
The consumer SHALL use `A2AClient` to send `message/send` requests to the provider, passing user queries routed to specific skills. Each A2A call creates a fresh httpx client for thread safety.

#### Scenario: Delegating a weather query
- **WHEN** the LangGraph agent decides it needs weather data for Barcelona
- **THEN** the consumer sends a `message/send` request with "weather Barcelona this weekend" and parses the returned Task artifacts

### Requirement: Consumer maintains multi-turn context via contextId
The consumer SHALL track `contextId` returned from the provider and pass it on subsequent messages within the same user conversation via `set_context_id()`.

#### Scenario: Multi-turn conversation
- **WHEN** the user says "change the hotel to something cheaper" after an initial trip plan
- **THEN** the consumer sends the follow-up message to the provider with the same `contextId`

### Requirement: Consumer exposes HTTP endpoint for external UI
The consumer SHALL expose `POST /message` accepting `{ "text", "context_id" }` and returning `{ "response", "context_id", "activity_log" }`. The `activity_log` lists all A2A calls made during the request.

#### Scenario: Chat UI sends a message
- **WHEN** a POST request hits `/message` with `{ "text": "Plan a weekend in Barcelona", "context_id": null }`
- **THEN** the consumer returns a response with itinerary, new context_id, and activity_log of 6 A2A calls

### Requirement: Consumer has agent timeout
The consumer SHALL wrap agent invocation in `asyncio.wait_for()` with a configurable timeout (default 90s via `AGENT_TIMEOUT` env var) to prevent demo hangs.

#### Scenario: Agent times out
- **WHEN** the agent takes longer than 90 seconds
- **THEN** the consumer returns an error message with the partial activity_log collected so far

### Requirement: Consumer configurable via environment variables
The consumer SHALL read `PROVIDER_URL`, `ANTHROPIC_API_KEY`, `MODEL_NAME`, and `AGENT_TIMEOUT` from environment variables.

#### Scenario: Custom provider URL
- **WHEN** `PROVIDER_URL` is set to `http://192.168.1.50:3000`
- **THEN** the consumer discovers and communicates with the provider at that URL
