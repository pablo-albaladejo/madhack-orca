## 1. Project Setup

- [ ] 1.1 Initialize `provider-agent/` with `package.json` (express, @a2a-js/sdk, dotenv, typescript, tsx — pin exact SDK version) and `tsconfig.json` (strict, ES modules)
- [ ] 1.2 Initialize `consumer-agent/` with `requirements.txt` (a2a-sdk, langgraph, langchain-anthropic, langchain-core, python-dotenv, fastapi, uvicorn — pin exact SDK version) and basic project structure
- [ ] 1.3 Create `.env.example` files in both directories with all required API key placeholders
- [ ] 1.4 Initialize `chat-ui/` with Streamlit dependency and basic structure
- [ ] 1.5 Create `start.sh` script that launches all three components (provider, consumer, chat UI) in one command

## 2. Provider A2A Server (Priority: skeleton first)

- [ ] 2.1 Create Express server with A2A JSON-RPC handler using @a2a-js/sdk (DefaultRequestHandler, InMemoryTaskStore). JSON-RPC endpoint at `/` (root)
- [ ] 2.2 Define Agent Card with 5 skills (weather, flights, restaurants, activities, hotels) and serve at `/.well-known/agent-card.json`. Ensure `url` field is full base URL (`http://localhost:3000/`)
- [ ] 2.3 Implement keyword-based skill router that dispatches incoming messages to the correct skill handler. One-skill-per-message principle
- [ ] 2.4 Implement contextId passthrough — provider MUST return same contextId that came in the request
- [ ] 2.5 Verify: `curl http://localhost:3000/.well-known/agent-card.json` returns valid Agent Card

## 3. Travel Skills — Provider (Start with mock, swap real APIs if time permits)

- [ ] 3.1 Implement weather skill: OpenWeatherMap 5-day forecast API call, with mock fallback if no API key
- [ ] 3.2 Implement hotels skill: curated mock data for European cities (Madrid, Barcelona, Lisbon, Paris, Sevilla) + mock booking/cancellation (return fake confirmation numbers)
- [ ] 3.3 Implement restaurants skill: Google Places Nearby Search (type=restaurant), with mock fallback
- [ ] 3.4 Implement activities skill: Google Places Nearby Search (type=museum|tourist_attraction), with mock fallback
- [ ] 3.5 Implement flights skill: Amadeus OAuth2 auth + Flight Offers Search + mock booking, with mock fallback (deprioritize — Amadeus OAuth is highest-risk)
- [ ] 3.6 Ensure all skills return DataPart (structured JSON) + TextPart (human summary) in artifacts
- [ ] 3.7 Add colored console logging on provider for each incoming A2A request (visible in terminal during demo)

## 4. Consumer A2A Client

- [ ] 4.1 Implement provider discovery: use A2ACardResolver to fetch Agent Card from configurable URL (default `http://localhost:3000`) and extract skills list
- [ ] 4.2 Implement A2A message sender: A2AClient wrapper that sends message/send and parses Task response
- [ ] 4.3 Create LangChain tools — one per provider skill — that send A2A messages, compress the response (strip verbose metadata), and return essential fields only
- [ ] 4.4 Implement contextId tracking: map A2A contextId to LangGraph thread_id via MemorySaver checkpointer
- [ ] 4.5 Verify: consumer can discover provider and send a weather query via A2A (FIRST INTEGRATION CHECKPOINT — do this before anything else in consumer)

## 5. Consumer Reasoning (LangGraph)

- [ ] 5.1 Build agent with `create_react_agent(model, tools, system_prompt, checkpointer=MemorySaver())`
- [ ] 5.2 Write system prompt (<200 tokens): instruct LLM to call relevant skills with trigger keywords, then compose weather-aware day-by-day itinerary. Include skill keyword reference
- [ ] 5.3 Test multi-turn: verify "change the hotel" re-queries only hotels skill, "what about Sevilla?" re-queries all skills
- [ ] 5.4 Add booking/cancellation tool calls: "book the hotel" triggers hotels skill with booking action via A2A

## 6. Consumer HTTP Endpoint

- [ ] 6.1 Create FastAPI app with `POST /message` accepting `{ text, context_id }` and returning `{ response, context_id, activity_log }` (activity_log = list of A2A calls made)
- [ ] 6.2 Wire endpoint to LangGraph `create_react_agent` invocation with thread_id = context_id
- [ ] 6.3 Verify: `curl -X POST localhost:8000/message -d '{"text":"Plan a weekend in Barcelona"}'` returns itinerary

## 7. Chat UI

- [ ] 7.1 Create Streamlit chat app using `st.chat_message` and `st.chat_input`
- [ ] 7.2 Implement conversation state: store context_id in session_state, pass on each request
- [ ] 7.3 Add A2A activity log sidebar: show which skills were called and their status (parse activity_log from consumer response)
- [ ] 7.4 Add loading spinner while waiting for consumer response
- [ ] 7.5 Verify: full flow from chat UI → consumer → provider → APIs → response displayed with activity log

## 8. End-to-End Verification

- [ ] 8.1 Run all three components via `start.sh` (provider :3000, consumer :8000, chat :8501)
- [ ] 8.2 Test full trip planning flow: "Plan a weekend in Barcelona" → coherent itinerary with visible A2A calls in sidebar
- [ ] 8.3 Test multi-turn: follow up with "change the hotel to something cheaper" → only hotels re-queried
- [ ] 8.4 Test booking: "book the hotel" → confirmation number appears
- [ ] 8.5 Show Agent Card in browser: `http://localhost:3000/.well-known/agent-card.json`
