## ADDED Requirements

### Requirement: Consumer discovers provider via Agent Card
The consumer SHALL use `A2ACardResolver` to fetch the provider's Agent Card from a configurable URL (default `http://localhost:3000`) and extract available skills.

#### Scenario: Successful discovery
- **WHEN** the consumer starts and the provider is running at localhost:3000
- **THEN** the consumer fetches `/.well-known/agent-card.json`, parses the skills array, and registers each skill as an available tool for the LangGraph agent

### Requirement: Consumer sends A2A messages to provider
The consumer SHALL use `A2AClient` to send `message/send` requests to the provider, passing user queries routed to specific skills.

#### Scenario: Delegating a weather query
- **WHEN** the LangGraph planner decides it needs weather data for Barcelona
- **THEN** the consumer sends a `message/send` request to the provider with a text message containing "weather in Barcelona this weekend" and parses the returned Task artifacts

### Requirement: Consumer maintains multi-turn context
The consumer SHALL track `contextId` returned from the provider and pass it on subsequent messages within the same user conversation, enabling the provider to correlate related requests.

#### Scenario: Multi-turn conversation
- **WHEN** the user says "change the hotel to something cheaper" after an initial trip plan
- **THEN** the consumer sends the follow-up message to the provider with the same `contextId` from the previous exchange

### Requirement: Consumer exposes HTTP endpoint for external UI
The consumer SHALL expose `POST /message` accepting `{ "text": "string", "context_id": "string|null" }` and returning `{ "response": "string", "context_id": "string" }`. This endpoint is the integration point for the Chat UI or Orca.

#### Scenario: Chat UI sends a message
- **WHEN** a POST request hits `/message` with `{ "text": "Plan a weekend in Barcelona", "context_id": null }`
- **THEN** the consumer processes the request through LangGraph, calls provider skills as needed, and returns `{ "response": "...", "context_id": "abc-123" }`

#### Scenario: Chat UI sends follow-up
- **WHEN** a POST request hits `/message` with `{ "text": "What about Sevilla instead?", "context_id": "abc-123" }`
- **THEN** the consumer uses the existing context to understand it's a modification of the previous plan

### Requirement: Consumer configurable via environment variables
The consumer SHALL read `PROVIDER_URL`, `ANTHROPIC_API_KEY`, and `MODEL_NAME` from environment variables (`.env` file).

#### Scenario: Custom provider URL
- **WHEN** `PROVIDER_URL` is set to `http://192.168.1.50:3000`
- **THEN** the consumer discovers and communicates with the provider at that URL instead of localhost
