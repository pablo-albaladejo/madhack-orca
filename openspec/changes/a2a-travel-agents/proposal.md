# Proposal: A2A Travel Agents

## What

Build two A2A-connected agents for travel planning at the MADHACK x Orca hackathon:

- **Provider Agent** (TypeScript/Express) — wraps travel APIs as A2A skills
- **Consumer Agent** (Python/LangGraph) — orchestrates user requests via A2A delegation

## Why

The hackathon challenge requires two interconnected agents communicating via the A2A protocol. Judging criteria are **Functionality** (working outputs), **API Integration** (diverse real APIs), and **Efficiency** (token optimization). This architecture maximizes all three within a 2-hour build window.

## Key Decisions (Council-Validated, 5/5 BUILD)

| Decision | Rationale |
|----------|-----------|
| Provider has NO LLM | 0 tokens, <100ms latency, scores high on Efficiency |
| 5 skills, 2 real APIs | Open-Meteo (weather) + Overpass (restaurants) are free, no key. Flights + hotels are parameterized mocks. Booking is in-memory CRUD. Scores on API Integration + Functionality. |
| Booking skill (CRUD) | Event brief requires "full CRUD logic, including booking and cancellation". Live book + cancel is the demo's most memorable moment. |
| Orca integration first | Orca boilerplate arrives at 19:00. Assess it in first 15 min, not during polish. Hidden judging criterion. |
| gpt-4o-mini for consumer | Cheapest model with reliable tool-calling. Sufficient for routing. |
| No streaming | `message/send` is simpler, more reliable for live demo |
| Visible A2A traffic log | The "wow moment" — judges see agents talking in real time |
| Drop Amadeus | OAuth registration risk too high for 2h build |

## Scope

- Two agents running locally (localhost:3000 + localhost:8000)
- 5 travel skills (weather, restaurants, flights, hotels, booking)
- Single-turn demo flow (contextId wired but not demoed)
- Terminal-based demo with colored A2A traffic logs
- Orca-compatible agent card

## Out of Scope

- Authentication/security
- Database/persistence (beyond in-memory)
- Frontend/UI
- Docker/deployment
- Streaming (SSE)
- Multi-turn demo flow
