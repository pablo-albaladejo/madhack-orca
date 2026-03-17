> Synced: 2026-03-17

### Requirement: Consumer exposes activity polling endpoint
The consumer SHALL expose `GET /activity/{context_id}` that returns the current activity_log for an in-progress request as a JSON array. The endpoint does NOT clear the log on read.

#### Scenario: Polling during processing
- **WHEN** a `/message` request is being processed and some tools have completed
- **THEN** `GET /activity/{context_id}` returns an array with completed and sending entries, each with `skill_query`, `status`, and `timestamp`

#### Scenario: Polling after completion
- **WHEN** the `/message` request has completed
- **THEN** `GET /activity/{context_id}` returns the full activity log with all entries marked completed

### Requirement: Thread-safe activity store
The consumer SHALL use a thread-safe `ActivityStore` singleton mapping `context_id` to activity entries, using `update_by_query` to match entries by `skill_query` (not by position) to avoid race conditions with parallel A2A calls.

#### Scenario: Concurrent skill updates
- **WHEN** 6 A2A skills complete in parallel
- **THEN** each skill's entry is updated correctly with its own response_preview and timestamp

### Requirement: Chat UI shows live A2A progress
The chat UI SHALL send `/message` POST in a background thread (ThreadPoolExecutor), poll `/activity/{context_id}` every 0.3 seconds, and render progress at top-level using `st.empty().markdown()` with status icons and timestamps.

#### Scenario: Progressive rendering
- **WHEN** the consumer is processing a trip planning request
- **THEN** the main area shows a live-updating markdown block with ⏳ sending and ✅ completed entries, including response previews

### Requirement: Sidebar shows final activity state
The sidebar SHALL display the final activity log with timestamps and status icons after the response arrives (on `st.rerun()`).

#### Scenario: Timestamp display
- **WHEN** all skills have completed
- **THEN** the sidebar shows each skill with `[HH:MM:SS]` timestamp and ✅ icon
