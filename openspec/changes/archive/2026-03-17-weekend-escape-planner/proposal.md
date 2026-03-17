## Why

We need a working, end-to-end A2A template ready before the MADHACK x Orca hackathon (March 18, 2026). The hackathon gives 2 hours to build two interconnected agents (consumer + provider) for travel planning. By building the full system as practice now, we discover integration problems early and arrive with a proven template where we only swap skills/prompts on the day.

## What Changes

- Create a **Provider agent** (TypeScript/Express) serving 5 travel skills via A2A protocol: weather, flights, restaurants, activities, and hotels (mock)
- Create a **Consumer agent** (Python/LangGraph) that discovers the provider, reasons about travel data, and builds coherent itineraries with multi-turn conversation support
- Add a **desacoplable Chat UI** (Streamlit or Gradio) that talks to the consumer via HTTP — easily replaceable if Orca provides its own UI
- Set up **API integrations**: OpenWeatherMap (weather), Amadeus (flights), Google Places (restaurants + activities), plus realistic mock data for hotels
- Configure `.env`-based API key management so keys are swapped in seconds

## Capabilities

### New Capabilities
- `provider-a2a-server`: TypeScript Express server with A2A protocol support (@a2a-js/sdk), Agent Card at /.well-known/agent-card.json, and skill routing
- `travel-skills`: Five provider skills — weather (OpenWeatherMap), flights (Amadeus sandbox), restaurants (Google Places), activities (Google Places), hotels (mock) — each with search/query logic
- `consumer-a2a-client`: Python LangGraph agent that discovers provider via A2ACardResolver, delegates to skills via message/send, and maintains multi-turn context via contextId
- `consumer-reasoning`: LangGraph graph that reasons across skill responses (e.g., weather influences activity recommendations) and assembles coherent itineraries
- `chat-ui`: Desacoplable web UI (Streamlit or Gradio) that communicates with consumer agent via HTTP POST /message endpoint

### Modified Capabilities

(none — greenfield project)

## Impact

- **New directories**: `provider-agent/`, `consumer-agent/`, `chat-ui/`
- **Dependencies**: `@a2a-js/sdk`, `express` (TS); `a2a-sdk`, `langgraph`, `langchain`, `streamlit` or `gradio` (Python)
- **External APIs**: OpenWeatherMap, Amadeus (sandbox), Google Places — all require API keys in `.env`
- **Ports**: Provider on :3000, Consumer on :8000, Chat UI on :8501
