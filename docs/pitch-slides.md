# MADHACK x Orca — Pitch Slides
> 3-5 min · March 18, 2026

---

## SLIDE 1 — Title

# ✈️ Weekend Escape Planner
### Two AI agents planning your perfect weekend — via A2A protocol

**Team:** [nombre]
**Stack:** Python · TypeScript · LangGraph · A2A

---

## SLIDE 2 — The Problem

# Planning a weekend trip is painful

- 🔍 Google Flights → separate tab
- 🏨 Booking.com → another tab
- 🌤️ Weather app → another tab
- 🍽️ TripAdvisor → another tab
- 📅 Manually reconcile everything

> **What if two AI agents could do all of this in one conversation?**

---

## SLIDE 3 — The Solution

# Two agents. One conversation.

```
You: "Plan a weekend in Barcelona"

Agent: ✅ Checking weather...
       ✅ Finding flights from Madrid (Vueling €87)
       ✅ Searching hotels (Hotel Gòtic €95/night)
       ✅ Finding restaurants (El Nacional ★4.4)
       ✅ Activities (Sagrada Família, Park Güell)
       ✅ Events (Coldplay at Estadi Olímpic €65-180)

       → Full day-by-day itinerary with links
```

---

## SLIDE 4 — Architecture

# Two real agents. A2A protocol.

```
┌─────────────┐    A2A JSON-RPC    ┌─────────────────────┐
│  CONSUMER   │ ─────────────────▶ │      PROVIDER       │
│             │                    │                      │
│ Python      │   message/send     │  TypeScript          │
│ LangGraph   │   contextId        │  Express             │
│ Claude      │                    │  Claude Haiku        │
│ Sonnet 4.6  │ ◀───────────────── │  (skill routing)    │
└─────────────┘    Task + artifacts └──────────┬──────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                         OpenWeather     Google Places    Ticketmaster
                         SerpAPI         (restaurants     (events)
                         (flights)        activities)
```

---

## SLIDE 5 — A2A in Action

# Not a chatbot. Two agents talking.

**Consumer discovers Provider via Agent Card:**
```
GET /.well-known/agent-card.json → 6 skills
```

**Consumer delegates via A2A:**
```json
{ "method": "message/send",
  "params": { "message": {
    "parts": [{"text": "weather Barcelona this weekend"}],
    "contextId": "abc-123"
  }}}
```

**Provider reasons (LLM) → executes → returns artifacts**

> contextId links all calls in one conversation

---

## SLIDE 6 — What We Built

# 6 skills. 5 real APIs. Full CRUD.

| Skill | API | |
|-------|-----|-|
| 🌤️ Weather | OpenWeatherMap | Real-time |
| ✈️ Flights | Google Flights (SerpAPI) | Real prices |
| 🏨 Hotels | Mock + booking | Confirmation # |
| 🍽️ Restaurants | Google Places | Maps links |
| 🎭 Activities | Google Places | Maps links |
| 🎵 Events | Ticketmaster | Real URLs |

**+ Booking & cancellation** (full CRUD as required)

---

## SLIDE 7 — Live Demo

# [DEMO]

1. **"Plan a weekend in Barcelona"** → watch 6 A2A calls in real-time
2. **"Change the hotel to something cheaper"** → only 1 A2A call (multi-turn)
3. **"Book the hotel"** → confirmation number via A2A
4. **Open Agent Card** → `/.well-known/agent-card.json`

> Show terminal + UI side by side

---

## SLIDE 8 — Why It Works

# The premise of this hackathon — proven

> *"User interfaces are being replaced by conversations with AI agents,
> and integrations between services are shifting from APIs to AI-to-AI communication."*

**We built exactly that:**
- ✅ Consumer reasons, doesn't just proxy
- ✅ Provider is an agent (LLM routing), not a REST wrapper
- ✅ Standard A2A protocol — plugs into any Orca-compatible system
- ✅ Multi-turn context via contextId

---

## SLIDE 9 — Thank You

# ✈️ Weekend Escape Planner

**Try it:** https://madhack-orca-cnzx9zvg3wpjfm5u3xtmpe.streamlit.app

**Agent Card:** https://madhack-orca-production.up.railway.app/.well-known/agent-card.json

**Code:** github.com/pablo-albaladejo/madhack-orca

---
*Built with Python · TypeScript · LangGraph · A2A Protocol · Claude*
