# Tasks: A2A Travel Agents

## Pre-Hackathon (Tonight, March 17)

- [ ] **T0.1** Install and verify SDKs
  - `cd provider-agent && npm install @a2a-js/sdk express uuid cors dotenv && npm install -D @types/express @types/node typescript tsx`
  - `cd consumer-agent && pip install "a2a-sdk" langgraph langchain-openai httpx`
  - Run hello-world round-trip from docs/a2a-research.md Section 9.6 to confirm cross-language compatibility
  - **Owner**: Both devs
  - **Time**: 30 min

- [ ] **T0.2** Verify free APIs are accessible
  - `curl "https://api.open-meteo.com/v1/forecast?latitude=40.42&longitude=-3.70&current_weather=true"`
  - `curl "https://nominatim.openstreetmap.org/search?q=Madrid&format=json&limit=1"`
  - Test Overpass query for restaurants
  - **Owner**: TS dev
  - **Time**: 15 min

---

## Minute 0: Orca Integration (0:00–0:15)

- [ ] **T0.5** Orca boilerplate assessment (FIRST THING — both devs)
  - Read the Orca starter boilerplate repo provided at the event
  - Identify: what format does Orca expect for agent cards? Any SDK wrapper needed?
  - Determine: does Orca need a specific endpoint, auth, or agent card field?
  - Adapt agent-card.ts config if needed (keep it config-driven for easy changes)
  - **Owner**: Both devs, 15 min max
  - **Why**: Orca integration is the hidden judging criterion. If it doesn't work, nothing else matters.

---

## Hour 1: Independent Builds (0:15–1:00)

### Provider Agent (TS Dev)

- [ ] **T1.1** Scaffold provider project (10 min)
  - Init `provider-agent/` with package.json, tsconfig.json
  - Configure ES modules, strict mode, single quotes, no semicolons
  - Add npm scripts: `"dev": "tsx watch src/index.ts"`
  - **Files**: `package.json`, `tsconfig.json`

- [ ] **T1.2** Define agent card with 5 skills (10 min)
  - Create `src/agent-card.ts` with AgentCard object
  - 5 skills: weather, restaurants, flights, hotels, booking
  - URL: `http://localhost:3000/`
  - capabilities: `{ streaming: false }`
  - **Files**: `src/agent-card.ts`
  - **Verify**: `curl http://localhost:3000/.well-known/agent-card.json`

- [ ] **T1.3** Create TravelExecutor with routing (15 min)
  - Single executor class implementing AgentExecutor interface
  - Keyword-based routing: parse message text → route to skill handler
  - Return task with text artifact for each skill result
  - **Files**: `src/executor.ts`

- [ ] **T1.4** Implement weather skill with Open-Meteo (15 min)
  - `src/skills/geocoding.ts`: city name → lat/lon via Nominatim
  - `src/skills/weather.ts`: lat/lon → forecast via Open-Meteo
  - Format response as readable text (temperature, conditions, forecast)
  - **Files**: `src/skills/geocoding.ts`, `src/skills/weather.ts`
  - **Verify**: Send A2A message "weather in Madrid" → get real forecast

- [ ] **T1.5** Wire Express app + A2A handler (10 min)
  - `src/index.ts`: Express app with DefaultRequestHandler
  - Mount JSON-RPC endpoint at `/`
  - Agent card served at `/.well-known/agent-card.json`
  - **Files**: `src/index.ts`
  - **Verify**: `npm run dev` starts on :3000, agent card accessible

### Consumer Agent (Python Dev)

- [ ] **T1.6** Scaffold consumer project (10 min)
  - Init `consumer-agent/` with requirements.txt, main.py
  - Set up venv, install dependencies
  - **Files**: `requirements.txt`, `main.py`

- [ ] **T1.7** Create send_to_agent tool (15 min)
  - `tools.py`: A2AClient wrapper as LangChain tool
  - Discovers provider via A2ACardResolver
  - Sends message/send, extracts text from response
  - **Files**: `tools.py`

- [ ] **T1.8** Create LangGraph agent (15 min)
  - `agent.py`: create_react_agent with gpt-4o-mini
  - System prompt <200 tokens (list available skills)
  - Wire send_to_agent as the only tool
  - **Files**: `agent.py`

- [ ] **T1.9** Add A2A logging middleware (10 min)
  - `logging_middleware.py`: colored stdout output for each A2A call
  - Format: `[HH:MM:SS] → Provider message/send "..."`
  - Format: `[HH:MM:SS] ← Provider completed "..."`
  - ANSI colors: green for outgoing, blue for incoming
  - **Files**: `logging_middleware.py`

- [ ] **T1.10** Wire main.py entry point (10 min)
  - Discovery on startup: resolve provider agent card
  - Accept user input from stdin (simple REPL)
  - Run LangGraph agent with user message
  - Print final response
  - **Files**: `main.py`

---

## Hour 1.5: Integration + More Skills (1:00–1:30)

- [ ] **T2.1** First end-to-end round-trip (15 min)
  - Start provider on :3000, consumer on :8000
  - Send "What's the weather in Madrid?" through consumer
  - Verify: consumer discovers provider, sends A2A message, gets real weather data
  - Debug any cross-language issues (Part structure, response parsing)
  - **Owner**: Both devs together

- [ ] **T2.2** Implement restaurants skill (10 min)
  - `src/skills/restaurants.ts`: Overpass API query for restaurants by city
  - Uses geocoding to get city area, queries amenity=restaurant
  - Returns top 10 restaurants with names
  - **Owner**: TS dev
  - **Files**: `src/skills/restaurants.ts`

- [ ] **T2.3** Implement flights mock (5 min)
  - `src/skills/flights.ts`: parameterized mock returning realistic flight data
  - Different results per city pair (BCN→MAD, LON→MAD, etc.)
  - Include airline, price, departure time
  - **Owner**: TS dev
  - **Files**: `src/skills/flights.ts`

- [ ] **T2.4** Implement hotels mock (5 min)
  - `src/skills/hotels.ts`: parameterized mock returning hotel data
  - Different results per city (Madrid, Barcelona, etc.)
  - Include hotel name, price per night, rating
  - **Owner**: TS dev
  - **Files**: `src/skills/hotels.ts`

- [ ] **T2.5** Implement booking skill — CRUD (15 min)
  - `src/skills/booking.ts`: in-memory booking store
  - **Book**: receives flight/hotel ID + passengers → generates confirmation ID (CONF-XXXXX) → stores in Map
  - **Cancel**: receives confirmation ID → removes from Map → returns cancellation confirmation
  - **List**: returns all active bookings
  - Routing keywords: "book", "reserve", "cancel", "confirmation"
  - **Owner**: TS dev
  - **Files**: `src/skills/booking.ts`
  - **Why**: Event brief requires "full CRUD logic, including booking and cancellation". This is the demo's most memorable moment.

---

## Hour 2: Polish + Demo Prep (1:30–2:00)

- [ ] **T3.1** Full demo flow test (10 min)
  - "Plan a weekend trip to Madrid from Barcelona"
  - Verify: consumer calls weather → restaurants → flights → hotels
  - Verify: logging middleware shows all 5 A2A calls
  - Verify: final response is a coherent travel plan
  - Test booking: "Book that flight" → get confirmation ID
  - Test cancel: "Cancel booking CONF-XXXXX" → get cancellation
  - **Owner**: Both devs

- [ ] **T3.2** Bug fixes (10 min)
  - Fix any integration issues found in T3.1
  - Ensure all 4 skills return data without errors
  - **Owner**: Both devs

- [ ] **T3.3** Demo rehearsal x2 (10 min)
  - Practice the 4-minute demo script:
    - 0:00 — Type trip request, hit enter
    - 0:30 — Show agent card in browser
    - 1:00 — Walk through A2A traffic log
    - 2:00 — Show assembled travel plan
    - 3:00 — Mention Orca compatibility
  - Pre-warm consumer with dummy request before going on stage
  - **Owner**: Both devs

---

## Demo Script (5 minutes)

1. **The Hook (0:00–0:30)**: No intro, no slides. Type: "Plan a weekend trip to Madrid — flights from Barcelona, hotel for 2 nights, and what's the weather like?" Hit enter. Let it run.

2. **Agent Card (0:30–1:15)**: While consumer is thinking, open `localhost:3000/.well-known/agent-card.json` in browser. Point to 5 skills. "Our provider exposes five travel skills over A2A. The consumer discovered this card automatically at startup — no hardcoded URLs, just protocol-compliant discovery."

3. **A2A Traffic (1:15–2:00)**: Point to colored log terminal. Walk through each call: "Watch — the consumer delegates weather to the provider. That's a LIVE Open-Meteo call, real temperature right now in Madrid. Now flights. Now hotels. Five A2A round trips, all JSON-RPC, all protocol-compliant."

4. **Result (2:00–2:30)**: Show assembled travel plan with real Madrid weather. "The consumer assembled this from multiple provider responses. No single agent knows everything — that's the point of A2A."

5. **CRUD — The wow moment (2:30–3:30)**: Type: "Book the first flight and the hotel." Show confirmation IDs appearing. Then type: "Actually, cancel the hotel." Show cancellation confirmed. "Full CRUD — search, book, cancel — all through agent-to-agent communication. Neither agent was designed to work with the other. Discovery and capability negotiation happen at runtime via the protocol."

6. **Close (3:30–4:00)**: "Both agents are A2A-compliant and pluggable into Orca without modification." If Orca UI is available, show agent discovered there. Leave time for judge questions.

**Pre-demo checklist**:
- Pre-warm consumer with a dummy request (avoid cold LLM latency)
- Have a backup terminal tab with a pre-recorded successful run
- Test the exact demo prompt twice before going on stage
