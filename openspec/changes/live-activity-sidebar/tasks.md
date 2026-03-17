## 1. Consumer Activity Endpoint

- [x] 1.1 Add per-context activity storage in consumer (dict mapping context_id → activity_log snapshot)
- [x] 1.2 Update a2a_client.py to write activity_log entries to the shared per-context store as they happen
- [x] 1.3 Add `GET /activity/{context_id}` endpoint to main.py that returns the current activity snapshot
- [x] 1.4 Ensure activity_log is NOT cleared until the client explicitly acknowledges (keep data available for polling)

## 2. Chat UI Live Polling

- [x] 2.1 Refactor chat UI to send `/message` POST in a background thread (ThreadPoolExecutor)
- [x] 2.2 Add polling loop: while waiting for response, poll `GET /activity/{context_id}` every 1.5 seconds
- [x] 2.3 Render activity entries progressively in sidebar using `st.empty()` containers (no full rerun)
- [x] 2.4 Show timestamps and status icons (⏳ sending, ✅ completed, ❌ error) per entry

## 3. Verification

- [ ] 3.1 Test: send "Plan a weekend in Barcelona", sidebar shows 5-6 entries appearing progressively during wait
- [ ] 3.2 Test: after response arrives, sidebar shows all entries as completed with timestamps
