## ADDED Requirements

### Requirement: Events skill returns upcoming events for a city
The events skill SHALL query Ticketmaster Discovery API for events in a given city within the upcoming weekend dates and return event name, venue, date/time, price range, and category.

#### Scenario: Events search in a city
- **WHEN** the events skill receives a message like "events in Barcelona this weekend"
- **THEN** it calls Ticketmaster API with the city and upcoming Friday-Sunday date range and returns a DataPart with an array of events with `name`, `venue`, `date`, `time`, `price_min`, `price_max`, `category` and a TextPart with a human-readable summary

#### Scenario: Events skill without API key
- **WHEN** the events skill is called but `TICKETMASTER_API_KEY` is not set
- **THEN** it returns realistic mock event data for the requested city

### Requirement: Events skill registered in provider
The events skill SHALL be registered in the provider's keyword router with keywords `event`, `events`, `concert`, `show`, `teatro`, `espectaculo` and listed in the Agent Card.

#### Scenario: Agent Card includes events skill
- **WHEN** a client fetches the Agent Card
- **THEN** the skills array contains an entry with id `events`, name `Events & Shows`, and relevant tags and examples

### Requirement: Consumer has search_events tool
The consumer SHALL have a `search_events` async tool that sends an A2A message with the `events` keyword to the provider.

#### Scenario: Trip planning includes events
- **WHEN** the user asks to plan a weekend trip
- **THEN** the consumer calls search_events along with the other 5 skills and includes relevant events in the itinerary
