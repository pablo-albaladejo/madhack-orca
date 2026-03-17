# Design: A2A Travel Agents

## Architecture Overview

```
[User] → [Python/LangGraph Consumer :8000] ──A2A──→ [TypeScript/Express Provider :3000]
              │                                              │
         gpt-4o-mini                                   NO LLM (0 tokens)
         create_react_agent                            TravelExecutor
         send_to_agent tool                            ├── weather  → Open-Meteo
         A2A logging middleware                        ├── restaurants → Overpass/OSM
              │                                        ├── flights  → Mock
         Discovers provider via                        ├── hotels   → Mock
         A2ACardResolver                               ├── booking  → Mock (CRUD)
              │                                        └── geocoding → Nominatim
              │
         /.well-known/agent-card.json ←────────────────────┘
```

## Provider Agent (TypeScript/Express)

### Structure

```
provider-agent/
├── src/
│   ├── index.ts              # Express app + A2A setup
│   ├── executor.ts           # TravelExecutor (routes to skills)
│   ├── skills/
│   │   ├── weather.ts        # Open-Meteo API integration
│   │   ├── restaurants.ts    # Overpass/OSM API integration
│   │   ├── flights.ts        # Parameterized mock
│   │   ├── hotels.ts         # Parameterized mock
│   │   ├── booking.ts        # Mock CRUD (book/cancel, returns confirmation ID)
│   │   └── geocoding.ts      # Nominatim (city → lat/lon)
│   └── agent-card.ts         # AgentCard definition (5 skills)
├── package.json
└── tsconfig.json
```

### Agent Card

```json
{
  "name": "Travel Provider",
  "description": "Provides travel information: weather forecasts, restaurant recommendations, flight search, and hotel search for any destination.",
  "url": "http://localhost:3000/",
  "version": "1.0.0",
  "capabilities": { "streaming": false },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "skills": [
    {
      "id": "weather",
      "name": "Weather Forecast",
      "description": "Get current weather and forecast for a city",
      "tags": ["weather", "forecast", "temperature"],
      "examples": ["What's the weather in Madrid?", "Temperature in Barcelona this weekend"]
    },
    {
      "id": "restaurants",
      "name": "Restaurant Search",
      "description": "Find restaurants in a city using OpenStreetMap data",
      "tags": ["restaurants", "food", "dining"],
      "examples": ["Find restaurants in Madrid", "Best places to eat in Barcelona"]
    },
    {
      "id": "flights",
      "name": "Flight Search",
      "description": "Search for flights between cities",
      "tags": ["flights", "airlines", "travel"],
      "examples": ["Flights from Barcelona to Madrid", "Find flights to Paris next Friday"]
    },
    {
      "id": "hotels",
      "name": "Hotel Search",
      "description": "Search for hotels in a city",
      "tags": ["hotels", "accommodation", "lodging"],
      "examples": ["Hotels in Madrid", "Find accommodation in Barcelona for 2 nights"]
    },
    {
      "id": "booking",
      "name": "Travel Booking",
      "description": "Book or cancel flights and hotels. Returns confirmation ID.",
      "tags": ["booking", "reservation", "cancel", "CRUD"],
      "examples": ["Book flight IB3214 for 2 passengers", "Cancel booking CONF-48291"]
    }
  ]
}
```

### TravelExecutor Routing

The executor receives the A2A message text and routes to the correct skill using keyword matching:

```
"weather" / "temperature" / "forecast" → weather skill
"restaurant" / "food" / "eat" / "dining" → restaurants skill
"flight" / "fly" / "airline" → flights skill
"hotel" / "accommodation" / "stay" / "lodging" → hotels skill
"book" / "reserve" / "cancel" / "confirmation" → booking skill
default → return all skills description
```

No LLM needed. The consumer agent already formulates clear, skill-specific messages.

### Real APIs

**Open-Meteo (Weather)**:
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current_weather=true
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum
  &timezone=auto
  &forecast_days=7
```

**Overpass (Restaurants)**:
```
POST https://overpass-api.de/api/interpreter
  data=[out:json];area[name="{city}"]->.a;node(area.a)["amenity"="restaurant"](if:t["name"]!="");out 10;
```

**Nominatim (Geocoding)**:
```
GET https://nominatim.openstreetmap.org/search
  ?q={city}&format=json&limit=1
```

### Mock APIs

Flights and hotels return deterministic but realistic JSON keyed by destination city. Different cities return different results to avoid looking static during demo.

### Booking Skill (CRUD)

In-memory store for bookings. Supports:
- **Book**: receives flight/hotel ID + passenger info → stores booking → returns confirmation ID (e.g. `CONF-48291`)
- **Cancel**: receives confirmation ID → removes from store → returns cancellation confirmation
- **List**: returns all active bookings for the session

This satisfies the event brief requirement for "full CRUD logic, including booking and cancellation" and creates the demo's most memorable moment: a live booking + cancellation flow.

## Consumer Agent (Python/LangGraph)

### Structure

```
consumer-agent/
├── main.py                   # Entry point, A2A server + discovery
├── agent.py                  # LangGraph agent definition
├── tools.py                  # send_to_agent tool
├── logging_middleware.py     # Colored A2A traffic logger
└── requirements.txt
```

### LangGraph Agent

```python
create_react_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=[send_to_agent],
    prompt=SYSTEM_PROMPT,  # <200 tokens
)
```

### System Prompt (<200 tokens)

```
You are a travel planning assistant. You help users plan trips by delegating to a travel provider agent.

Available skills via the travel provider:
- weather: Get weather forecast for a city
- restaurants: Find restaurants in a city
- flights: Search flights between cities
- hotels: Search hotels in a city
- booking: Book or cancel flights/hotels (returns confirmation ID)

For trip planning requests, call the relevant skills and combine the results into a helpful travel plan. Always include weather. When the user confirms, book flights/hotels and provide confirmation IDs.
```

### send_to_agent Tool

Single tool that sends a message to the provider via A2AClient:

```python
@tool
async def send_to_agent(message: str) -> str:
    """Send a task to the travel provider agent. Be specific about what
    you need: weather, restaurants, flights, or hotels for a destination."""
```

The tool handles:
1. Gets the pre-registered A2AClient
2. Creates SendMessageRequest with the message
3. Sends via client.send_message()
4. Extracts text from response artifacts or status message
5. Returns the text result

### A2A Logging Middleware

Prints each outgoing/incoming A2A call to stdout with ANSI colors:

```
[19:43:01] → Provider  message/send  "What's the weather in Madrid?"
[19:43:02] ← Provider  completed     "Madrid: 18°C, sunny, humidity 45%"
[19:43:02] → Provider  message/send  "Find restaurants in Madrid"
[19:43:03] ← Provider  completed     "La Barraca, Sobrino de Botín, ..."
```

This is the demo "wow moment" — judges see agents talking in real time.

## Communication Flow

```
1. User sends: "Plan a weekend trip to Madrid"
2. Consumer LLM decides to call weather first
3. Consumer → Provider: message/send "What's the weather in Madrid?"
4. Provider routes to weather skill
5. Provider calls Nominatim: Madrid → (40.4168, -3.7038)
6. Provider calls Open-Meteo: forecast for (40.4168, -3.7038)
7. Provider → Consumer: task/completed with weather data
8. Consumer LLM decides to call restaurants
9. Consumer → Provider: message/send "Find restaurants in Madrid"
10. Provider routes to restaurants skill
11. Provider calls Overpass: restaurants in Madrid
12. Provider → Consumer: task/completed with restaurant list
13. Consumer LLM decides to call flights + hotels
14. (Similar flow with mock data)
15. Consumer LLM assembles final travel plan
16. User sees complete response
17. User says: "Book that flight and hotel"
18. Consumer → Provider: message/send "Book flight IB3214 for 2 passengers"
19. Provider booking skill stores booking, returns CONF-48291
20. Consumer → Provider: message/send "Book Hotel Gran Via Madrid for 2 nights"
21. Provider booking skill stores booking, returns CONF-48292
22. User sees confirmation IDs
23. User says: "Cancel the hotel"
24. Consumer → Provider: message/send "Cancel booking CONF-48292"
25. Provider removes booking, confirms cancellation
26. User sees cancellation confirmed
```

## Token Budget

| Component | Input Tokens | Output Tokens | Total |
|-----------|-------------|---------------|-------|
| Consumer system prompt | ~150 | — | 150 |
| Consumer reasoning (per skill call) | ~100 | ~50 | 150 |
| Consumer final assembly | ~400 | ~300 | 700 |
| Provider | 0 | 0 | 0 |
| **Total per interaction** | **~650** | **~350** | **~1000** |

Estimated cost per demo interaction: ~$0.00015 (gpt-4o-mini pricing)
