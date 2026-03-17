## ADDED Requirements

### Requirement: Provider serves Agent Card
The provider SHALL serve a valid A2A Agent Card as JSON at `GET /.well-known/agent-card.json` describing its name, description, URL, version, capabilities, and skills array.

#### Scenario: Agent Card is discoverable
- **WHEN** a client sends `GET http://localhost:3000/.well-known/agent-card.json`
- **THEN** the server responds with status 200 and a JSON body containing `name`, `url`, `version`, `skills` (array with 5 skills), and `capabilities` fields

### Requirement: Provider handles message/send via JSON-RPC
The provider SHALL accept A2A `message/send` requests via JSON-RPC 2.0 over HTTP POST at the service URL, route to the appropriate skill handler, and return a Task object with status `completed` and artifacts containing the skill response.

#### Scenario: Valid message/send request
- **WHEN** a client POSTs a JSON-RPC request with method `message/send` and a message containing text
- **THEN** the server routes to the matching skill, executes it, and returns a JSON-RPC response with a Task containing `status.state: "completed"` and `artifacts` with the result

#### Scenario: Unknown skill request
- **WHEN** a client sends a message that does not match any skill keywords
- **THEN** the server returns a Task with `status.state: "completed"` and an artifact containing a helpful message listing available skills

### Requirement: Provider supports multi-turn via contextId
The provider SHALL accept and return `contextId` on messages and tasks, enabling the consumer to maintain conversation context across multiple exchanges.

#### Scenario: Context preserved across messages
- **WHEN** a client sends a message with a `contextId`
- **THEN** the response Task includes the same `contextId`

### Requirement: Provider skill routing
The provider SHALL route incoming messages to the correct skill handler based on keyword matching against the message text content. Each skill SHALL declare its trigger keywords.

#### Scenario: Weather keyword routes to weather skill
- **WHEN** a message contains the word "weather" or "clima" or "forecast"
- **THEN** the provider routes to the weather skill handler

#### Scenario: Flight keyword routes to flights skill
- **WHEN** a message contains the word "flight" or "vuelo" or "fly"
- **THEN** the provider routes to the flights skill handler

### Requirement: Provider configuration via environment variables
The provider SHALL read all API keys and configuration from environment variables defined in a `.env` file. The server SHALL fail fast with a clear error message if required API keys are missing.

#### Scenario: Missing API key
- **WHEN** the provider starts without `OPENWEATHER_API_KEY` set
- **THEN** the server logs a warning indicating which keys are missing but still starts (skills without keys return mock data)
