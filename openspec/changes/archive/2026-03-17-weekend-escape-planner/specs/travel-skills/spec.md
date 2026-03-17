## ADDED Requirements

### Requirement: Weather skill returns forecast data
The weather skill SHALL query OpenWeatherMap 5-day forecast API for a given city and return temperature, weather condition, humidity, and wind speed for each day.

#### Scenario: Weather query for a city
- **WHEN** the weather skill receives a message like "weather in Barcelona this weekend"
- **THEN** it calls OpenWeatherMap API with the city name and returns a DataPart containing an array of daily forecasts with `date`, `temp_min`, `temp_max`, `condition` (e.g., "Rain", "Clear"), `humidity`, and `wind_speed`

#### Scenario: Weather skill without API key
- **WHEN** the weather skill is called but `OPENWEATHER_API_KEY` is not set
- **THEN** it returns realistic mock weather data for the requested city

### Requirement: Flights skill returns flight search results
The flights skill SHALL query Amadeus Flight Offers Search API for flights between two cities on given dates and return flight options with airline, departure/arrival times, duration, and price.

#### Scenario: Flight search between cities
- **WHEN** the flights skill receives a message like "flights from Madrid to Barcelona on Friday"
- **THEN** it authenticates via OAuth2 client_credentials, calls Amadeus flight search, and returns a DataPart containing an array of flight offers with `airline`, `flight_number`, `departure`, `arrival`, `duration`, `price`, and `currency`

#### Scenario: Flights skill without API key
- **WHEN** the flights skill is called but `AMADEUS_API_KEY` is not set
- **THEN** it returns realistic mock flight data for the requested route

### Requirement: Restaurants skill returns nearby restaurants
The restaurants skill SHALL query Google Places Nearby Search API for restaurants near a location and return name, rating, price level, cuisine type, and address.

#### Scenario: Restaurant search in a city
- **WHEN** the restaurants skill receives a message like "restaurants in Barcelona Gothic Quarter"
- **THEN** it calls Google Places API with the location and returns a DataPart containing an array of restaurants with `name`, `rating`, `price_level` (1-4), `address`, `cuisine_type`, and `total_ratings`

#### Scenario: Restaurants skill without API key
- **WHEN** the restaurants skill is called but `GOOGLE_PLACES_API_KEY` is not set
- **THEN** it returns realistic mock restaurant data for the requested area

### Requirement: Activities skill returns attractions and activities
The activities skill SHALL query Google Places Nearby Search API with types `museum`, `tourist_attraction`, and `amusement_park` for a given location and return activity options.

#### Scenario: Activities search in a city
- **WHEN** the activities skill receives a message like "activities in Barcelona"
- **THEN** it calls Google Places API with activity-related types and returns a DataPart containing an array of activities with `name`, `type` (museum/attraction/park), `rating`, `address`, and `description`

#### Scenario: Activities skill without API key
- **WHEN** the activities skill is called but `GOOGLE_PLACES_API_KEY` is not set
- **THEN** it returns realistic mock activity data for the requested area

### Requirement: Hotels skill returns accommodation options
The hotels skill SHALL return realistic hotel data for a given city. This skill uses curated mock data (no external API).

#### Scenario: Hotel search in a city
- **WHEN** the hotels skill receives a message like "hotels in Barcelona"
- **THEN** it returns a DataPart containing an array of hotels with `name`, `neighborhood`, `stars` (1-5), `price_per_night`, `currency`, and `amenities` array

### Requirement: Hotels skill supports mock booking and cancellation
The hotels skill SHALL support a "book" action that returns a mock confirmation number, and a "cancel" action that confirms cancellation. This satisfies the event brief's "full CRUD logic, including booking and cancellation" requirement.

#### Scenario: Booking a hotel
- **WHEN** the hotels skill receives a message like "book Hotel Gòtic in Barcelona"
- **THEN** it returns a DataPart with `{ "action": "booked", "confirmation": "HTL-20260318-4829", "hotel": "Hotel Gòtic", "check_in": "2026-03-20", "check_out": "2026-03-22" }` and a TextPart confirming the booking

#### Scenario: Cancelling a hotel booking
- **WHEN** the hotels skill receives a message like "cancel booking HTL-20260318-4829"
- **THEN** it returns a DataPart with `{ "action": "cancelled", "confirmation": "HTL-20260318-4829" }` and a TextPart confirming cancellation

### Requirement: Flights skill supports mock booking
The flights skill SHALL support a "book" action that returns a mock booking reference.

#### Scenario: Booking a flight
- **WHEN** the flights skill receives a message like "book flight VY1234 on Friday"
- **THEN** it returns a DataPart with `{ "action": "booked", "confirmation": "FLT-VY1234-4829", "flight": "VY1234", "date": "2026-03-20" }` and a TextPart confirming the booking

### Requirement: All skills return structured DataParts
Every skill SHALL return results as A2A artifacts containing a DataPart (`kind: "data"`) with structured JSON, plus a TextPart (`kind: "text"`) with a human-readable summary.

#### Scenario: Skill response format
- **WHEN** any skill completes successfully
- **THEN** the Task artifacts contain at least one artifact with two parts: a DataPart with structured results and a TextPart summarizing the results in natural language
