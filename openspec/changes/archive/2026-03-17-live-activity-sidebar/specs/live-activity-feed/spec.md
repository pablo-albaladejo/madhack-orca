## ADDED Requirements

### Requirement: Consumer exposes activity polling endpoint
The consumer SHALL expose `GET /activity/{context_id}` that returns the current activity_log for an in-progress request as a JSON array.

#### Scenario: Polling during processing
- **WHEN** a `/message` request is being processed and 3 of 5 tools have completed
- **THEN** `GET /activity/{context_id}` returns an array with 3 completed entries and 2 sending entries

#### Scenario: Polling after completion
- **WHEN** the `/message` request has completed
- **THEN** `GET /activity/{context_id}` returns the full activity log with all entries marked completed

### Requirement: Chat UI shows live A2A progress in sidebar
The chat UI SHALL poll `/activity/{context_id}` every 1.5 seconds while waiting for the `/message` response and render each skill call progressively in the sidebar.

#### Scenario: Progressive sidebar rendering
- **WHEN** the consumer is processing a trip planning request
- **THEN** the sidebar shows entries appearing one by one as each A2A skill call completes, with status icons (⏳ sending, ✅ completed, ❌ error)

### Requirement: Sidebar shows timestamps
Each activity log entry in the sidebar SHALL display a timestamp showing when the A2A call completed.

#### Scenario: Timestamp display
- **WHEN** the weather skill completes at 14:23:02
- **THEN** the sidebar shows "[14:23:02] ✅ weather: 22°C, sunny"
