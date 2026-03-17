## ADDED Requirements

### Requirement: Chat UI provides conversational interface
The chat UI SHALL present a web-based chat interface where users type messages and receive formatted responses from the consumer agent.

#### Scenario: Sending a message
- **WHEN** the user types "Plan a weekend in Barcelona" and presses Enter
- **THEN** the UI sends a POST to the consumer's `/message` endpoint and displays the response in a chat bubble

### Requirement: Chat UI maintains conversation context
The chat UI SHALL store the `context_id` returned by the consumer and pass it on subsequent messages, enabling multi-turn conversations.

#### Scenario: Follow-up message
- **WHEN** the user sends a second message after receiving a response with `context_id: "abc-123"`
- **THEN** the UI includes `context_id: "abc-123"` in the POST body

### Requirement: Chat UI is fully decoupled from agents
The chat UI SHALL communicate with the consumer exclusively via `POST /message` HTTP endpoint. It SHALL have no direct dependency on A2A, LangGraph, or provider internals.

#### Scenario: Replacing the UI
- **WHEN** Orca provides its own UI at the hackathon
- **THEN** the consumer's `/message` endpoint works identically without the Streamlit UI running

### Requirement: Chat UI shows A2A activity log
The chat UI SHALL display a sidebar or secondary panel showing real-time A2A activity — which skills are being called and their status. This makes the agent-to-agent communication visible to demo audiences.

#### Scenario: Activity log during trip planning
- **WHEN** the consumer calls weather, flights, hotels, restaurants, and activities skills
- **THEN** the sidebar shows entries like "Calling weather skill...", "Weather: completed", "Calling flights skill...", etc. in real time

#### Scenario: Activity log on booking
- **WHEN** the consumer sends a booking action via A2A
- **THEN** the sidebar shows "Booking hotel via A2A..." → "Booking confirmed: HTL-20260318-4829"

### Requirement: Chat UI shows loading state
The chat UI SHALL display a loading indicator while waiting for the consumer to respond, since LLM + API calls may take several seconds.

#### Scenario: Slow response
- **WHEN** the consumer takes 5 seconds to respond
- **THEN** the UI shows a spinner or "thinking..." indicator until the response arrives

### Requirement: Chat UI is launchable with a single command
The chat UI SHALL start with a single command (`streamlit run app.py` or `python chat.py`) with no additional configuration beyond the consumer URL.

#### Scenario: Starting the UI
- **WHEN** the developer runs `streamlit run app.py`
- **THEN** the chat UI opens in the browser at localhost:8501 and is ready to use (assuming consumer is running at localhost:8000)
