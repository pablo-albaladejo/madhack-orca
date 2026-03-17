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

### Requirement: Chat UI shows A2A activity log
The chat UI SHALL display a sidebar showing A2A activity — which skills were called and their status (completed/error), parsed from the `activity_log` field in the consumer response.

#### Scenario: Activity log after trip planning
- **WHEN** the consumer returns a response with 6 entries in activity_log
- **THEN** the sidebar shows 6 entries with status icons (completed/error)

### Requirement: Chat UI shows loading state
The chat UI SHALL display a spinner while waiting for the consumer to respond.

#### Scenario: Slow response
- **WHEN** the consumer takes 15 seconds to respond
- **THEN** the UI shows "Planning your trip... (calling travel skills via A2A)" spinner

### Requirement: Chat UI is launchable with a single command
The chat UI SHALL start with `streamlit run app.py` with no additional configuration beyond the consumer URL (default localhost:8000).

#### Scenario: Starting the UI
- **WHEN** the developer runs `streamlit run app.py`
- **THEN** the chat UI opens at localhost:8501
