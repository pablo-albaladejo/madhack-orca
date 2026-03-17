## Context

The consumer's `invoke_agent()` runs synchronously from the UI's perspective — Streamlit sends POST /message and waits for the full response. The activity_log is only returned with the final response. We need a way to expose in-progress activity before the agent finishes.

## Goals / Non-Goals

**Goals:**
- Show A2A calls as they happen in the sidebar during the wait
- Keep Streamlit's simple request model (no websockets)
- Minimal changes to existing consumer architecture

**Non-Goals:**
- Real-time streaming of the LLM's text output
- WebSocket-based UI
- Replacing Streamlit with a custom frontend

## Decisions

### Polling approach over SSE

**Choice**: Consumer exposes `GET /activity/{context_id}` that returns the current activity_log snapshot. Chat UI polls this every 1.5 seconds while waiting for the main `/message` response.

**Why not SSE**: Streamlit cannot consume SSE natively. Would need JavaScript injection or a custom component. Polling is simpler, works within Streamlit's constraints, and 1.5s intervals are fine for 15-20s waits.

### Implementation flow

```
Chat UI                    Consumer                    Provider
  │                          │                           │
  ├─POST /message────────────►│                           │
  │  (async, non-blocking)   ├─A2A: weather──────────────►│
  │                          │                    ◄───────┤
  ├─GET /activity/ctx-123────►│ → [{weather: done}]       │
  │◄─────────────────────────┤                           │
  │  (render in sidebar)     ├─A2A: flights──────────────►│
  │                          │                    ◄───────┤
  ├─GET /activity/ctx-123────►│ → [{weather: done},       │
  │◄─────────────────────────┤    {flights: done}]       │
  │  (update sidebar)        ├─A2A: hotels───────────────►│
  │                          │         ...                │
  │◄─POST /message response──┤                           │
  │  (final itinerary)       │                           │
```

### Threading in Streamlit

Streamlit runs in a single thread. To poll while waiting, we use `concurrent.futures.ThreadPoolExecutor`: one thread for the `/message` POST, the main thread polls `/activity` and updates the sidebar.

## Risks / Trade-offs

- **[Polling adds HTTP overhead]** → Mitigation: 1.5s interval = ~10 polls per request. Negligible.
- **[Race condition: activity log cleared before poll]** → Mitigation: Don't clear activity_log until `/message` response is fully sent. Add a separate `/activity/{context_id}` that reads without clearing.
- **[Streamlit rerun complexity]** → Mitigation: Use `st.empty()` containers that update in place without full rerun.
