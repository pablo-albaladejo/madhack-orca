> Synced: 2026-03-17

### Requirement: Chat UI provides conversational interface
The chat UI SHALL present a Streamlit web-based chat interface where users type messages and receive formatted responses from the consumer agent.

#### Scenario: Sending a message
- **WHEN** the user types "Plan a weekend in Barcelona" and presses Enter
- **THEN** the UI sends a POST to the consumer's `/message` endpoint and displays the response in a chat bubble

### Requirement: Chat UI maintains conversation context
The chat UI SHALL store the `context_id` returned by the consumer in `session_state` and pass it on subsequent messages.

#### Scenario: Follow-up message
- **WHEN** the user sends a second message after receiving a response with `context_id: "abc-123"`
- **THEN** the UI includes `context_id: "abc-123"` in the POST body

### Requirement: Chat UI is fully decoupled from agents
The chat UI SHALL communicate with the consumer exclusively via `POST /message` HTTP endpoint. It SHALL have no direct dependency on A2A, LangGraph, or provider internals.

#### Scenario: Replacing the UI
- **WHEN** Orca provides its own UI at the hackathon
- **THEN** the consumer's `/message` endpoint works identically without the Streamlit UI running

### Requirement: Chat UI shows live A2A progress during wait
The chat UI SHALL poll `GET /activity/{context_id}` every 0.3s via ThreadPoolExecutor while waiting for the `/message` response, rendering progress at top-level with `st.empty().markdown()`.

#### Scenario: Live progress during processing
- **WHEN** the consumer is processing a trip planning request
- **THEN** the main area shows a live-updating block with ⏳/✅ icons, skill names, timestamps, and response previews

### Requirement: Chat UI shows final activity log in sidebar
The sidebar SHALL display the final activity log with timestamps and status icons after `st.rerun()`.

#### Scenario: Final sidebar state
- **WHEN** the response arrives and the page reruns
- **THEN** the sidebar shows all skills with ✅ icons and `[HH:MM:SS]` timestamps

### Requirement: Chat UI is launchable with a single command
The chat UI SHALL start with `streamlit run app.py` with no additional configuration beyond the consumer URL (default localhost:8000).

#### Scenario: Starting the UI
- **WHEN** the developer runs `streamlit run app.py`
- **THEN** the chat UI opens at localhost:8501
