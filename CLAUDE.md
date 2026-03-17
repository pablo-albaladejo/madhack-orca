# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See @README.md for project overview, @AGENTS.md for setup and conventions, and @docs/ for research.

## Architecture

Two independent agents communicating via A2A protocol (JSON-RPC over HTTP):

- `consumer-agent/` — Python 3.10+, LangGraph, `a2a-sdk`. Orchestrates user travel requests by discovering and delegating to provider agents.
- `provider-agent/` — TypeScript, Express, `@a2a-js/sdk`. Wraps travel REST APIs (flights, hotels, weather, restaurants) as A2A skills with CRUD logic.

Provider serves its agent card at `/.well-known/agent-card.json`. Consumer discovers provider via `A2ACardResolver` pointing to `http://localhost:3000`. Multi-turn conversations use `contextId` passed back on each message.

## Commands

```bash
# Provider
cd provider-agent && npm install && npm run dev    # localhost:3000

# Consumer
cd consumer-agent && pip install -r requirements.txt && python main.py  # localhost:8000

# Verify agent card
curl http://localhost:3000/.well-known/agent-card.json

# Verify A2A communication
# Consumer sends message/send to provider and gets a task response
```

Both agents must run simultaneously for end-to-end testing.

## Code Style

- **Python**: async/await, type hints, ruff formatting
- **TypeScript**: strict mode, ES modules, single quotes, no semicolons

## Key References

- @docs/a2a-research.md Section 9 has copy-paste implementation patterns for both agents
- @docs/event-brief.md for hackathon rules and judging criteria
- A2A protocol spec: https://a2a-protocol.org/latest/specification/

## Subagents — Consult on EVERY Decision

Before any technical decision, feature addition, or architecture change, delegate to the relevant subagents. They run proactively, not on demand.

| Agent | Role | When to consult |
|-------|------|-----------------|
| `hackathon-judge` | Scores decisions against real judging criteria | Every feature/architecture decision |
| `demo-coach` | Ensures work is visible in the 3-5 min demo | Every feature/architecture decision |
| `ai-engineer` | Technical architecture for LLM agents | Agent design, prompts, graph structure |
| `a2a-researcher` | A2A protocol authority | Any A2A protocol question before writing code |
| `finops` | Token efficiency and cost optimization | Prompt design, model selection, LLM calls |

IMPORTANT: Run `hackathon-judge` and `demo-coach` together on every significant decision. If something won't score points or won't be visible in the demo, don't build it.

## IMPORTANT

- Do NOT over-engineer. This is a 2-hour hackathon build with a 3-5 minute demo.
- Two developers work in parallel: senior TS on provider, Python dev on consumer. Keep workstreams independent.
- Always verify agent-to-agent communication after changes.
- Every decision must pass two gates: "Does this score points?" (judge) and "Will this be visible?" (demo-coach).
