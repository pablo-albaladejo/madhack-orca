## ADDED Requirements

### Requirement: Planner node decomposes user requests into skill calls
The LangGraph planner node SHALL use an LLM to analyze the user's message and decide which provider skills to invoke. It SHALL be able to call multiple skills in sequence for a single user request.

#### Scenario: Full trip planning request
- **WHEN** the user says "Plan a weekend trip to Barcelona"
- **THEN** the planner decides to call weather, flights, hotels, restaurants, and activities skills, and invokes them via A2A

#### Scenario: Specific request
- **WHEN** the user says "Find me cheap flights to Lisbon next Friday"
- **THEN** the planner decides to call only the flights skill

### Requirement: Synthesizer node combines skill results into coherent itinerary
The synthesizer node SHALL take all skill responses and compose a natural-language itinerary that accounts for weather conditions, timing, and logical sequencing.

#### Scenario: Weather-aware itinerary
- **WHEN** weather data shows rain on Saturday and sun on Sunday
- **THEN** the synthesizer recommends indoor activities (museums, covered restaurants) for Saturday and outdoor activities for Sunday

#### Scenario: Complete itinerary format
- **WHEN** all skills return data successfully
- **THEN** the synthesizer produces a day-by-day itinerary including: flight times, hotel recommendation, activities per day (morning/afternoon/evening), and restaurant suggestions per meal

### Requirement: Multi-turn state management
The consumer LangGraph graph SHALL maintain conversation state across turns, remembering previous skill results and user preferences so follow-up requests don't require re-querying all skills.

#### Scenario: Modifying one aspect of the plan
- **WHEN** the user says "change the hotel to something cheaper" after receiving a full plan
- **THEN** the consumer re-queries only the hotels skill with a lower price constraint, keeping all other plan components from the previous turn

#### Scenario: Changing destination
- **WHEN** the user says "what about Sevilla instead?" after a Barcelona plan
- **THEN** the consumer re-queries all skills for Sevilla, recognizing this is a full destination change

### Requirement: Planner includes skill trigger keywords in A2A messages
The consumer's ReAct agent system prompt SHALL instruct the LLM to format outgoing A2A messages with explicit skill trigger keywords. Each A2A call SHALL target one skill only (one-skill-per-message principle).

#### Scenario: Planner formats weather query
- **WHEN** the LLM decides to check the weather in Barcelona
- **THEN** it sends an A2A message containing "weather forecast Barcelona this weekend" (includes "weather" keyword)

#### Scenario: Planner formats booking action
- **WHEN** the LLM decides to book a hotel
- **THEN** it sends an A2A message containing "book hotel Hotel Gòtic in Barcelona" (includes "book" and "hotel" keywords)

### Requirement: Skill response compression
The consumer SHALL compress skill responses before passing them to the LLM for synthesis. Verbose API metadata (coordinates, confidence scores, place IDs) SHALL be stripped, keeping only essential fields (name, price, rating, key attributes).

#### Scenario: Compressing Google Places response
- **WHEN** the restaurants tool receives a full Google Places API response with 20+ fields per restaurant
- **THEN** it extracts only `name`, `rating`, `price_level`, `address`, and `cuisine_type` before returning to the LLM

### Requirement: Graceful handling of missing skill data
The consumer SHALL produce a useful response even if some skills fail or return empty results.

#### Scenario: Flights API unavailable
- **WHEN** the flights skill returns an error or empty result
- **THEN** the synthesizer still produces an itinerary with the available data (weather, hotels, restaurants, activities) and notes that flight information is currently unavailable
