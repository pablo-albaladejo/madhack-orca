## Why

The event brief explicitly lists "events, tours" as travel API categories. Our provider has 5 skills (weather, flights, hotels, restaurants, activities) but zero events coverage. Adding a real events skill covers a judging criterion gap and makes itineraries time-specific ("Coldplay Saturday at 21:00") instead of generic ("visit Park Güell").

## What Changes

- Add `events` skill to the provider using Ticketmaster Discovery API (free tier, 5000 calls/day, no credit card)
- Add `search_events` tool to the consumer
- Update Agent Card from 5 to 6 skills
- Update consumer system prompt to include events in trip planning calls

## Capabilities

### New Capabilities
- `events-skill`: Provider skill that queries Ticketmaster Discovery API for events in a city on specific dates, with mock fallback

### Modified Capabilities

(none)

## Impact

- **Provider**: New file `src/skills/events.ts`, register in `src/index.ts`, add to agent card
- **Consumer**: New tool in `tools.py`, update system prompt in `agent.py`
- **Dependencies**: None new — uses fetch (built-in Node 18+)
- **API key**: `TICKETMASTER_API_KEY` added to `.env`
