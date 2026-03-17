> Synced: 2026-03-17

### Requirement: ReAct agent decomposes user requests into skill calls
The consumer SHALL use `create_react_agent` from LangGraph with Claude Sonnet to analyze user messages and decide which provider skills to invoke. It SHALL call all 6 skills for trip planning requests.

#### Scenario: Full trip planning request
- **WHEN** the user says "Plan a weekend trip to Barcelona"
- **THEN** the agent calls weather, flights, hotels, restaurants, activities, and events skills via A2A

#### Scenario: Specific request
- **WHEN** the user says "Find me cheap flights to Lisbon next Friday"
- **THEN** the agent calls only the flights skill

### Requirement: Agent composes weather-aware itineraries
The ReAct agent SHALL compose day-by-day itineraries that account for weather conditions, scheduling outdoor activities on sunny days and indoor alternatives when rain is forecasted.

#### Scenario: Weather-aware itinerary
- **WHEN** weather data shows rain on Saturday and sun on Sunday
- **THEN** the agent recommends indoor activities for Saturday and outdoor activities for Sunday

### Requirement: Anti-double-calling instruction
The system prompt SHALL include "Call tools ONCE. Never call a tool a second time to refine or get more details" to prevent redundant A2A calls.

#### Scenario: Single round of tool calls
- **WHEN** the agent calls 6 skills for a trip planning request
- **THEN** it does NOT call any skill a second time in the same turn

### Requirement: Multi-turn state management
The agent SHALL maintain conversation state across turns via `MemorySaver` checkpointer, mapping A2A `contextId` to LangGraph `thread_id`.

#### Scenario: Modifying one aspect of the plan
- **WHEN** the user says "change the hotel to something cheaper" after a full plan
- **THEN** the agent re-queries only the hotels skill

### Requirement: Skill trigger keywords in A2A messages
The system prompt SHALL instruct the LLM to include explicit skill trigger keywords in A2A messages. Each tool prepends its keyword automatically.

#### Scenario: Tool prepends keyword
- **WHEN** the search_weather tool is called with "Barcelona this weekend"
- **THEN** it sends "weather Barcelona this weekend" to the provider

### Requirement: Graceful handling of missing skill data
The consumer SHALL produce a useful response even if some skills fail or return empty results.

#### Scenario: Flights API unavailable
- **WHEN** the flights skill returns an error
- **THEN** the agent still produces an itinerary with the available data and notes that flight information is unavailable
