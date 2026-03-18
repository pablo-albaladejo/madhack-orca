# MADHACK x Orca — Weekend Escape Planner

A2A-connected travel planning agents built for the [MADHACK x Orca](https://luma.com/m02vt010) hackathon in Madrid.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                                   │
│                                                                          │
│   Browser → Streamlit Chat UI (:8501)                                   │
│              chat-ui/app.py                                              │
│              POST /message + GET /activity/{ctx} (live polling)         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTP
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONSUMER AGENT (:8000)                              │
│                      Python / LangGraph / FastAPI                        │
│                                                                          │
│   create_react_agent(Claude Sonnet 4.6)                                 │
│   ├── Discovers provider via A2ACardResolver                            │
│   ├── 7 async tools → A2A message/send to provider                     │
│   ├── Weather-aware itinerary synthesis                                 │
│   ├── Multi-turn via MemorySaver (contextId → thread_id)               │
│   └── Live activity store for real-time UI polling                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ A2A Protocol (JSON-RPC over HTTP)
                               │ message/send + contextId
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROVIDER AGENT (:3000)                              │
│                      TypeScript / Express / @a2a-js/sdk                  │
│                                                                          │
│   Agent Card at /.well-known/agent-card.json                            │
│   LLM-based skill routing (Claude Haiku) + keyword fallback             │
│                                                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│   │ weather  │  │ flights  │  │ hotels   │  │restaurants│  │activities│ │
│   │OpenWeather│ │ SerpAPI  │  │  Mock    │  │  Google  │  │ Google │  │
│   │  (real)  │  │  (real)  │  │+ booking │  │ Places   │  │ Places │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                                          │
│   ┌──────────────────────┐                                              │
│   │       events         │                                              │
│   │   Ticketmaster (real)│                                              │
│   └──────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Language | Framework | Key deps |
|-----------|----------|-----------|----------|
| Provider | TypeScript | Express | `@a2a-js/sdk`, `@anthropic-ai/sdk` |
| Consumer | Python 3.10+ | LangGraph | `a2a-sdk`, `langchain-anthropic`, `fastapi` |
| Chat UI | Python | Streamlit | `requests`, `concurrent.futures` |

## APIs

| Skill | API | Data |
|-------|-----|------|
| weather | OpenWeatherMap | 5-day forecast, real-time |
| flights | SerpAPI Google Flights | Prices, times, real-time |
| restaurants | Google Places | Ratings, addresses, Maps links |
| activities | Google Places | Museums, attractions, Maps links |
| events | Ticketmaster Discovery | Concerts, sports, theatre with URLs |
| hotels | Curated mock | Booking & cancellation |

## Quick Start

```bash
# One command (starts all 3 services)
./start.sh

# Or manually:
cd provider-agent && npm install && npm run dev   # :3000
cd consumer-agent && pip install -r requirements.txt && python main.py  # :8000
cd chat-ui && pip install -r requirements.txt && streamlit run app.py   # :8501
```

Copy `.env.example` to `.env` and fill in your API keys before starting.

## Deployed

| Service | URL |
|---------|-----|
| Chat UI | https://madhack-orca-cnzx9zvg3wpjfm5u3xtmpe.streamlit.app |
| Consumer | https://zonal-communication-production-9d48.up.railway.app |
| Provider | https://madhack-orca-production.up.railway.app |

## Key Features

- **A2A protocol** — JSON-RPC over HTTP, Agent Card discovery, contextId multi-turn
- **LLM routing** — Provider uses Claude Haiku to reason which skill to invoke
- **Live A2A pipeline** — Chat UI polls progress every 0.3s, shows skills as they complete
- **Weather-aware** — Indoor/outdoor activities based on forecast
- **Full CRUD** — Hotel and flight booking with confirmation numbers
- **Real URLs** — Google Maps, Google Flights, Ticketmaster links in itinerary

## Docs

- [Hackathon Playbook](docs/hackathon-playbook.md) — step-by-step guide for the day
- [Event Brief](docs/event-brief.md) — schedule, rules, prizes
- [A2A Research](docs/a2a-research.md) — protocol spec, SDKs, implementation patterns

## Event

**March 18, 2026 · 18:00–22:00 · Casa del Lector, Madrid**
