# MADHACK x Orca

Prep repo for the [MADHACK x Orca](https://luma.com/m02vt010) hackathon — an AI agent infrastructure event in Madrid.

## The Challenge

Build two A2A-connected agents for travel planning:

- **Consumer agent** (Python/LangGraph) — takes user requests and orchestrates provider calls
- **Provider agent** (TypeScript/Express) — wraps travel APIs with CRUD logic (flights, hotels, weather, etc.)

Agents talk via the [A2A protocol](https://a2a-protocol.org/) and plug into Orca orchestration for the final demo.

## Tech Stack

| Agent | Language | Framework | A2A SDK |
|-------|----------|-----------|---------|
| Consumer | Python | LangGraph | `a2a-sdk` |
| Provider | TypeScript | Express | `@a2a-js/sdk` |

## Local Dev

Run both agents locally — no cloud needed:

```bash
# Terminal 1 — Provider
cd provider-agent
npm install
npm run dev          # localhost:3000

# Terminal 2 — Consumer
cd consumer-agent
pip install -r requirements.txt
python main.py       # localhost:8000
```

The consumer discovers the provider via `http://localhost:3000/.well-known/agent-card.json`.

## Docs

- [Event brief](docs/event-brief.md) — date, schedule, rules, prizes
- [Orca research](docs/orca-research.md) — platform overview and current state
- [A2A research](docs/a2a-research.md) — protocol spec, SDKs, code examples, implementation patterns

## Event

- **When:** March 18, 2026 · 18:00–22:00
- **Where:** Casa del Lector, Madrid
- **Build time:** 2 hours
- **Demo:** 3–5 min per team
