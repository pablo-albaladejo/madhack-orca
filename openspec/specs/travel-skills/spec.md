> Synced: 2026-03-17

### Requirement: Weather skill returns forecast data
The weather skill SHALL query OpenWeatherMap 5-day forecast API for a given city and return temperature, weather condition, humidity, and wind speed. City extraction uses shared `cities.ts` module (14 EU cities).

#### Scenario: Weather query for a city
- **WHEN** the weather skill receives a message like "weather in Barcelona this weekend"
- **THEN** it calls OpenWeatherMap API with the city name and returns a DataPart with forecasts and a TextPart summary

#### Scenario: Weather skill without API key
- **WHEN** the weather skill is called but `OPENWEATHER_API_KEY` is not set
- **THEN** it returns realistic mock weather data for the requested city

### Requirement: Flights skill returns flight search results
The flights skill SHALL query SerpAPI Google Flights for flights between two cities and return flight options with airline, times, duration, and price in EUR.

#### Scenario: Flight search between cities
- **WHEN** the flights skill receives a message like "flights from Madrid to Barcelona on Friday"
- **THEN** it calls SerpAPI with IATA codes and returns a DataPart with flight offers

#### Scenario: Flights skill without API key
- **WHEN** the flights skill is called but `SERPAPI_API_KEY` is not set
- **THEN** it returns realistic mock flight data for the requested route

### Requirement: Flights skill supports mock booking
The flights skill SHALL support a "book" action that returns a mock booking reference.

#### Scenario: Booking a flight
- **WHEN** the flights skill receives a message like "book flight VY1234 on Friday"
- **THEN** it returns a DataPart with booking confirmation and a TextPart confirming the booking

### Requirement: Restaurants skill returns nearby restaurants
The restaurants skill SHALL query Google Places Nearby Search API for restaurants near a location.

#### Scenario: Restaurant search in a city
- **WHEN** the restaurants skill receives a message like "restaurants in Barcelona"
- **THEN** it calls Google Places API and returns a DataPart with restaurants

#### Scenario: Restaurants skill without API key
- **WHEN** the restaurants skill is called but `GOOGLE_PLACES_API_KEY` is not set
- **THEN** it returns realistic mock restaurant data

### Requirement: Activities skill returns attractions and activities
The activities skill SHALL query Google Places Nearby Search API with types `museum`, `tourist_attraction`, and `amusement_park`.

#### Scenario: Activities search in a city
- **WHEN** the activities skill receives a message like "activities in Barcelona"
- **THEN** it calls Google Places API with activity-related types and returns a DataPart with activities

#### Scenario: Activities skill without API key
- **WHEN** the activities skill is called but `GOOGLE_PLACES_API_KEY` is not set
- **THEN** it returns realistic mock activity data

### Requirement: Hotels skill returns accommodation options
The hotels skill SHALL return curated mock hotel data for European cities (Madrid, Barcelona, Valencia, Lisbon, Sevilla, Paris).

#### Scenario: Hotel search in a city
- **WHEN** the hotels skill receives a message like "hotels in Barcelona"
- **THEN** it returns a DataPart with hotels including `name`, `neighborhood`, `stars`, `price_per_night`, `currency`, and `amenities`

### Requirement: Hotels skill supports mock booking and cancellation
The hotels skill SHALL support "book" and "cancel" actions with mock confirmation numbers.

#### Scenario: Booking a hotel
- **WHEN** the hotels skill receives a message like "book Hotel Gòtic in Barcelona"
- **THEN** it returns a DataPart with booking confirmation (HTL-{date}-{random})

#### Scenario: Cancelling a hotel booking
- **WHEN** the hotels skill receives a message like "cancel booking HTL-20260318-4829"
- **THEN** it returns a DataPart confirming cancellation

### Requirement: All skills return structured DataParts
Every skill SHALL return results as A2A artifacts containing a DataPart (`kind: "data"`) with structured JSON, plus a TextPart (`kind: "text"`) with a human-readable summary.

#### Scenario: Skill response format
- **WHEN** any skill completes successfully
- **THEN** the Task artifacts contain a DataPart with structured results and a TextPart summary
