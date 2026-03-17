# AGENTS.md

## Project

Hackathon prep for MADHACK x Orca — building two AI agents that communicate via the A2A (Agent-to-Agent) protocol for travel planning.

- **Consumer agent** (Python/LangGraph): accepts user requests, orchestrates provider calls
- **Provider agent** (TypeScript/Express): wraps travel REST APIs with CRUD logic

## Setup

### Provider (TypeScript)

```bash
cd provider-agent
npm install
npm run dev  # starts on localhost:3000
```

### Consumer (Python)

```bash
cd consumer-agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py  # starts on localhost:8000
```

Both agents must run simultaneously. Consumer discovers provider at `http://localhost:3000/.well-known/agent-card.json`.

## Code Style

- **Python**: 3.10+, async/await, type hints, ruff formatting, ES-style imports
- **TypeScript**: strict mode, ES modules, single quotes, no semicolons

## Testing

- Verify agent card is served: `curl http://localhost:3000/.well-known/agent-card.json`
- Verify A2A communication: consumer sends `message/send` to provider and gets a response
- No formal test suite — this is a 2-hour hackathon build

## Key Conventions

- A2A protocol (JSON-RPC over HTTP) for all inter-agent communication
- Agent Card at `/.well-known/agent-card.json` describes each agent's skills
- `contextId` must be passed back for multi-turn conversations
- Provider exposes travel skills (flights, hotels, weather, restaurants)
- Consumer uses LangGraph to reason about user requests and delegate to provider

## Documentation

- `docs/event-brief.md` — hackathon rules, schedule, prizes
- `docs/orca-research.md` — Orca platform overview
- `docs/a2a-research.md` — A2A protocol spec, SDKs, code examples (Section 9 has ready-to-use patterns)

## Constraints

- Build time: 2 hours
- Demo: 3-5 minutes per team
- Keep implementations minimal and demo-friendly
- Two parallel workstreams: provider (TS) and consumer (Python) are independent
