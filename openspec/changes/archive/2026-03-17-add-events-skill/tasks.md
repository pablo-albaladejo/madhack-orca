## 1. API Key Setup

- [x] 1.1 Register at https://developer.ticketmaster.com/ and get API key
- [x] 1.2 Add `TICKETMASTER_API_KEY` to `.env` and `.env.example`

## 2. Provider Events Skill

- [x] 2.1 Create `provider-agent/src/skills/events.ts` following the SkillHandler pattern: Ticketmaster API call with city + weekend dates, mock fallback, DataPart + TextPart response
- [x] 2.2 Add mock event data for 5 cities (Madrid, Barcelona, Valencia, Lisbon, Sevilla) with realistic events (concerts, sports, theatre)
- [x] 2.3 Register events skill in `src/index.ts` with keywords: event, events, concert, show, teatro, espectaculo
- [x] 2.4 Add events skill to Agent Card in `src/agent-card.ts`
- [x] 2.5 Verify: provider compiles (`npx tsc --noEmit`) and agent card shows 6 skills

## 3. Consumer Events Tool

- [x] 3.1 Add `search_events` async tool to `consumer-agent/tools.py` following existing pattern
- [x] 3.2 Update system prompt in `agent.py` to include `search_events` in the tool call list
- [x] 3.3 Verify: consumer imports work, 7 tools loaded

## 4. Verification

- [ ] 4.1 Test events skill directly via A2A: consumer sends "events in Barcelona" → gets event list
- [ ] 4.2 Test full trip planning: "Plan a weekend in Barcelona" → itinerary includes events
