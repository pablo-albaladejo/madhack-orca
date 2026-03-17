## Context

Existing provider has 5 skills following a consistent pattern: `SkillHandler` function, keyword routing, real API + mock fallback, DataPart + TextPart response. This change adds a 6th skill following the exact same pattern.

## Goals / Non-Goals

**Goals:**
- Events skill with real Ticketmaster data for European cities
- Same mock fallback pattern as other skills
- Consumer tool that calls events skill via A2A

**Non-Goals:**
- Ticket purchasing / booking (search only)
- Multiple events APIs
- Event filtering by genre/category (keep simple)

## Decisions

### Ticketmaster Discovery API

**Endpoint**: `GET https://app.ticketmaster.com/discovery/v2/events.json`

**Parameters**:
- `city`: city name
- `startDateTime`: ISO 8601 (e.g., `2026-03-20T00:00:00Z`)
- `endDateTime`: ISO 8601
- `size`: max results (5)
- `apikey`: API key
- `sort`: `date,asc`

**Response fields we extract**: `name`, `dates.start.localDate`, `dates.start.localTime`, `_embedded.venues[0].name`, `priceRanges[0].min`, `priceRanges[0].max`, `classifications[0].segment.name` (Music, Sports, Arts)

**Auth**: API key as query parameter. Registration at https://developer.ticketmaster.com/ — free, no credit card.

### Date handling

The consumer sends "events in Barcelona this weekend". The provider's events skill calculates the upcoming Friday-Sunday dates automatically from current date. No date parsing from message needed.

## Risks / Trade-offs

- **[Ticketmaster may have sparse EU data]** → Mitigation: Mock fallback with realistic events for 5 cities
- **[API key not created yet]** → Mitigation: Skill works with mock data by default
