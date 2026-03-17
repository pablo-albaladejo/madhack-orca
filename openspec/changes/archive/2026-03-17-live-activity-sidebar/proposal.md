## Why

During the 15-20 second wait while the consumer calls 5-6 A2A skills, the chat UI shows a static spinner. The activity log sidebar only populates AFTER the response arrives — by then judges are reading the itinerary, not the sidebar. The most impressive part of the demo (agents talking to each other) is invisible during the only moment judges are paying attention to the UI.

## What Changes

- Consumer exposes a streaming or polling endpoint that yields A2A call progress in real time
- Chat UI polls/streams this endpoint during the wait, rendering each skill call as it completes
- Sidebar shows live "Calling weather... ✅ Weather done" entries with timestamps

## Capabilities

### New Capabilities
- `live-activity-feed`: Real-time visibility into A2A skill calls during the consumer's processing, displayed in the Streamlit sidebar as they happen

### Modified Capabilities

(none)

## Impact

- **Consumer**: New `/status/{context_id}` polling endpoint or SSE stream in `main.py`
- **Chat UI**: Sidebar polling loop during the wait, progressive rendering
- **Provider**: No changes needed
