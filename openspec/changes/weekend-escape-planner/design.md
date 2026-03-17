## Context

Greenfield project for MADHACK x Orca hackathon practice. No existing code — we're building from scratch. Two developers work in parallel: one on the TypeScript provider, one on the Python consumer. The system must be a reusable template where skills/prompts are swappable on hackathon day.

A2A protocol v0.3.0 via JSON-RPC over HTTP. Provider serves Agent Card at `/.well-known/agent-card.json`. Consumer discovers provider via `A2ACardResolver`. Multi-turn conversations use `contextId`.

## Goals / Non-Goals

**Goals:**
- Working A2A communication between provider and consumer (message/send, contextId for multi-turn)
- Provider with 5 travel skills backed by real APIs where possible (3 real, 1 mock, 1 shared API key)
- Consumer that reasons across skill responses to build coherent itineraries
- Desacoplable Chat UI that connects via simple HTTP POST
- Template structure where swapping skills/prompts takes < 20 minutes
- Everything runs locally with `npm run dev` and `python main.py`

**Non-Goals:**
- Production deployment, auth, rate limiting, error recovery
- Streaming (message/stream) — message/send is sufficient for demo
- Push notifications or task cancellation
- Orca platform integration (will be provided at hackathon)
- Persistent storage — all in-memory

## Decisions

### 1. Provider: Express + @a2a-js/sdk with skill router

**Choice**: Each skill is an isolated module with a standard interface. A central router dispatches A2A messages to the correct skill based on intent keywords in the message text.

**Why not a single monolithic handler**: Skills must be swappable. Isolated modules mean you can delete `flights.ts` and add `tours.ts` without touching routing logic.

**Skill dispatch strategy**: Simple keyword matching on the incoming message text (e.g., "weather" → weather skill, "flight" → flights skill). No LLM needed in the provider — keep it fast and cheap.

```
incoming message → keyword router → skill handler → API call → A2A response
```

### 2. Consumer: LangGraph with `create_react_agent`

**Choice**: Use LangGraph's `create_react_agent` with a well-crafted system prompt. Each provider skill maps to a LangChain tool that sends an A2A message/send to the provider. The ReAct agent handles planning, tool calling, and synthesis in one loop.

**Why `create_react_agent` over custom graph**: A custom planner→tools→synthesizer graph adds 20-30 min of state wiring for no visible demo benefit. The ReAct agent handles plan→call→synthesize naturally. The system prompt instructs it to "call all relevant travel skills, then compose a day-by-day itinerary." That IS the synthesizer.

**Why LangGraph over plain LangChain**: LangGraph's ReAct agent handles state/memory for multi-turn naturally via `MemorySaver` checkpointer. `thread_id` maps directly to A2A `contextId`.

**Graph structure**:
```
create_react_agent(model, tools, system_prompt, checkpointer)
    │
    ├── LLM decides which tools to call (planner behavior)
    ├── Automatic tool execution loop (tool behavior)
    └── LLM synthesizes final response (synthesizer behavior)
```

**Key constraint**: The system prompt MUST instruct the LLM to include skill trigger keywords in outgoing A2A messages (e.g., "weather forecast Barcelona", not "what's the climate like in Barcelona"). This ensures the provider's keyword router matches correctly.

**Response compression**: Before tool results are passed back to the LLM, strip verbose API metadata and keep only essential fields (name, price, rating, key attributes). This cuts synthesizer input tokens by 30-40%.

### 3. API choices: OpenWeatherMap + Amadeus + Google Places

**Choice**: Three real API providers, all with free tiers sufficient for demo.

| API | Auth | Free tier | Complexity |
|-----|------|-----------|------------|
| OpenWeatherMap | API key in query param | 1000 calls/day | Trivial |
| Amadeus | OAuth2 client_credentials | 500 calls/month (sandbox) | Medium |
| Google Places (New) | API key in header | $200/month credit | Easy |

**Hotels mock**: No free hotel API with good data. Mock with realistic Madrid/Barcelona hotel data (name, neighborhood, price, stars, amenities).

**Alternatives considered**: Foursquare (less data richness), SerpAPI (costs money), Booking (no public API).

### 4. Chat UI: Streamlit over Gradio

**Choice**: Streamlit with `st.chat_message` for chat interface.

**Why over Gradio**: Streamlit's chat components look more polished out of the box. `st.chat_message` + `st.chat_input` gives a production-looking chat in ~30 lines.

**Decoupling contract**: Consumer exposes `POST /message` accepting `{ "text": "...", "context_id": "..." }` and returning `{ "response": "...", "context_id": "..." }`. Chat UI only knows this endpoint. If Orca provides UI, point it at the same endpoint.

### 5. LLM: Claude via Anthropic API

**Choice**: Claude (claude-sonnet-4-20250514 or latest) via `langchain-anthropic` for the consumer's reasoning.

**Why Claude**: We're already in the Claude ecosystem. Sonnet is fast and cheap for tool-calling.

**Fallback**: Easy to swap to `langchain-openai` if needed — LangGraph is LLM-agnostic.

## Risks / Trade-offs

- **[Amadeus OAuth complexity]** → Mitigation: Implement OAuth2 client_credentials flow as a reusable helper. If it blocks during hackathon, fall back to mock flight data.
- **[API rate limits during demo]** → Mitigation: Cache recent responses in-memory. Provider skills check cache before calling external API.
- **[Google Places API cost]** → Mitigation: $200 free credit is plenty. Use Nearby Search (not Text Search) to minimize cost per call.
- **[LLM latency in demo]** → Mitigation: Use Sonnet (fast) not Opus. Keep prompts concise. Provider returns structured data, not prose.
- **[A2A SDK breaking changes]** → Mitigation: Pin SDK versions. Both SDKs are pre-1.0 — lock to exact versions that work.
- **[Keyword routing too brittle]** → Mitigation: Consumer system prompt explicitly instructs LLM to include skill trigger keywords in A2A messages. One-skill-per-message principle.
- **[A2A calls invisible in demo]** → Mitigation: Add activity log sidebar in Streamlit OR colored terminal output on provider. Without this, judges see a chatbot, not an agent network.
- **[Missing CRUD for judging]** → Mitigation: Add mock booking/cancellation actions to hotels and flights skills. Return fake confirmation numbers. 10 lines each, closes the "full CRUD logic" gap from the event brief.
