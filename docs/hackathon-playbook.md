# Hackathon Playbook — MADHACK x Orca

> Guía paso a paso para el día del hackathon. Pasa este documento a Claude Code y ejecuta.

## Pre-requisitos (hacer ANTES del hackathon)

### API Keys necesarias

```bash
# 1. OpenWeatherMap (gratis, 1000 calls/día)
#    https://openweathermap.org/api → Sign up → API keys
OPENWEATHER_API_KEY=xxx

# 2. Google Places (gratis $200/mes crédito)
#    https://console.cloud.google.com → New project → Enable "Places API (New)" → Credentials → API key
GOOGLE_PLACES_API_KEY=xxx

# 3. Anthropic (para el consumer LLM)
ANTHROPIC_API_KEY=xxx
```

### Verificar dependencias

```bash
node --version   # >= 18
python --version # >= 3.10
npm --version
pip --version
```

### Verificar que las API keys funcionan

```bash
# OpenWeatherMap
curl "https://api.openweathermap.org/data/2.5/forecast?q=Madrid&appid=$OPENWEATHER_API_KEY&units=metric&cnt=5"

# Google Places
curl -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
  "https://places.googleapis.com/v1/places:searchNearby" \
  -d '{"locationRestriction":{"circle":{"center":{"latitude":40.4168,"longitude":-3.7038},"radius":1000}},"includedTypes":["restaurant"],"maxResultCount":3}'

```

---

## Timeline del hackathon (2 horas)

```
MINUTO    DEV 1 (TypeScript/Provider)           DEV 2 (Python/Consumer)
═══════   ══════════════════════════════         ═══════════════════════════
 0-10     Setup proyecto + dependencias          Setup proyecto + dependencias
10-25     A2A server + Agent Card + 1 skill      A2A client + discovery
25-35     ── CHECKPOINT 1: consumer llama provider via A2A ──
35-55     Añadir skills (hotels, restaurants)     ReAct agent + tools + system prompt
55-70     Añadir skills (activities, flights)     FastAPI /message endpoint
70-85     Booking actions + console logging       Streamlit chat UI + activity log
85-100    ── CHECKPOINT 2: demo completa E2E ──
100-110   Swap mock → APIs reales (si hay tiempo) Polish: prompts, UX
110-120   ── ENSAYO DE DEMO (2 veces mínimo) ──
```

### Checkpoints críticos

- **Minuto 25**: Consumer puede enviar `message/send` al provider y recibir respuesta. Si esto no funciona, PARA todo y arréglalo.
- **Minuto 85**: Demo completa funciona end-to-end. Si no estás aquí, recorta scope.
- **Minuto 110**: Si no has ensayado la demo, deja de programar AHORA.

---

## Fase 1: Setup (10 min)

### Dev 1 — Provider

```bash
mkdir -p provider-agent && cd provider-agent
npm init -y
npm install express @a2a-js/sdk dotenv
npm install -D typescript tsx @types/express @types/node

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true
  },
  "include": ["src"]
}
EOF

mkdir src
```

Añadir a `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts"
  }
}
```

`.env`:
```
OPENWEATHER_API_KEY=
GOOGLE_PLACES_API_KEY=
PORT=3000
```

### Dev 2 — Consumer

```bash
mkdir -p consumer-agent && cd consumer-agent
python -m venv .venv && source .venv/bin/activate

cat > requirements.txt << 'EOF'
a2a-sdk
langgraph
langchain-anthropic
langchain-core
python-dotenv
fastapi
uvicorn[standard]
httpx
EOF

pip install -r requirements.txt
```

`.env`:
```
ANTHROPIC_API_KEY=
PROVIDER_URL=http://localhost:3000
MODEL_NAME=claude-sonnet-4-20250514
```

---

## Fase 2: Provider A2A Server (15 min)

### Estructura de archivos

```
provider-agent/src/
├── index.ts              # Express server + A2A handler
├── agent-card.ts         # Agent Card definition
├── router.ts             # Keyword-based skill router
└── skills/
    ├── weather.ts        # OpenWeatherMap
    ├── flights.ts        # Amadeus
    ├── restaurants.ts    # Google Places
    ├── activities.ts     # Google Places
    └── hotels.ts         # Mock data + booking
```

### Agent Card (agent-card.ts)

```typescript
export const agentCard = {
  name: 'Travel Provider Agent',
  description: 'Provides travel data: weather, flights, hotels, restaurants, activities',
  url: 'http://localhost:3000/',
  version: '1.0.0',
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  skills: [
    {
      id: 'weather',
      name: 'Weather Forecast',
      description: 'Get weather forecast for a city',
      tags: ['weather', 'forecast', 'clima'],
      examples: ['weather in Barcelona this weekend']
    },
    {
      id: 'flights',
      name: 'Flight Search',
      description: 'Search flights between cities',
      tags: ['flights', 'vuelos', 'fly'],
      examples: ['flights from Madrid to Barcelona on Friday']
    },
    {
      id: 'hotels',
      name: 'Hotel Search & Booking',
      description: 'Search hotels and make bookings',
      tags: ['hotel', 'accommodation', 'book hotel', 'cancel hotel'],
      examples: ['hotels in Barcelona', 'book Hotel Gòtic']
    },
    {
      id: 'restaurants',
      name: 'Restaurant Search',
      description: 'Find restaurants in a city',
      tags: ['restaurant', 'food', 'dining'],
      examples: ['restaurants in Barcelona Gothic Quarter']
    },
    {
      id: 'activities',
      name: 'Activities & Attractions',
      description: 'Find museums, attractions, tours',
      tags: ['activities', 'museum', 'attractions', 'tours'],
      examples: ['activities in Barcelona']
    }
  ]
}
```

### Keyword router (router.ts)

```typescript
import type { SkillHandler } from './skills/types.js'

const skillMap = new Map<string[], SkillHandler>()

export function registerSkill(keywords: string[], handler: SkillHandler) {
  skillMap.set(keywords, handler)
}

export function routeMessage(text: string): SkillHandler | null {
  const lower = text.toLowerCase()
  for (const [keywords, handler] of skillMap) {
    if (keywords.some(kw => lower.includes(kw))) return handler
  }
  return null
}
```

### Skill interface

```typescript
// skills/types.ts
export type SkillHandler = (message: string) => Promise<{
  text: string
  data: Record<string, unknown>
}>
```

**Cada skill sigue este patrón**:
1. Parsear el mensaje para extraer ciudad/parámetros
2. Llamar API real (o mock si no hay key)
3. Devolver `{ text: "resumen", data: { resultados } }`

---

## Fase 3: Consumer A2A Client (15 min)

### Estructura de archivos

```
consumer-agent/
├── main.py               # FastAPI app + /message endpoint
├── agent.py              # create_react_agent setup
├── a2a_client.py         # A2A discovery + message sender
├── tools.py              # LangChain tools (one per skill)
└── .env
```

### A2A Client (a2a_client.py)

```python
import httpx
from a2a.client import A2AClient, A2ACardResolver
from a2a.types import SendMessageRequest, MessageSendParams

class TravelProviderClient:
    def __init__(self, base_url: str = 'http://localhost:3000'):
        self.base_url = base_url
        self.client = None
        self.skills = []

    async def discover(self):
        async with httpx.AsyncClient() as http:
            resolver = A2ACardResolver(httpx_client=http, base_url=self.base_url)
            card = await resolver.get_agent_card()
            self.skills = card.skills
            self.client = A2AClient(httpx_client=http, agent_card=card)
        return self.skills

    async def send(self, text: str, context_id: str | None = None) -> dict:
        async with httpx.AsyncClient() as http:
            resolver = A2ACardResolver(httpx_client=http, base_url=self.base_url)
            card = await resolver.get_agent_card()
            client = A2AClient(httpx_client=http, agent_card=card)

            from uuid import uuid4
            msg = {
                'role': 'user',
                'parts': [{'kind': 'text', 'text': text}],
                'messageId': uuid4().hex,
            }
            if context_id:
                msg['contextId'] = context_id

            request = SendMessageRequest(
                id=str(uuid4()),
                params=MessageSendParams(message=msg)
            )
            response = await client.send_message(request)
            # Extract text and data from artifacts
            return self._parse_response(response)
```

### LangGraph Agent (agent.py)

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic

SYSTEM_PROMPT = """You are a travel planning assistant. You have tools to query a travel provider agent.

IMPORTANT: When calling tools, use these EXACT keyword patterns:
- Weather: "weather forecast {city}"
- Flights: "flights from {origin} to {destination} on {date}"
- Hotels: "hotels in {city}" or "book hotel {name}" or "cancel booking {id}"
- Restaurants: "restaurants in {city} {area}"
- Activities: "activities in {city}"

For trip planning requests, call all relevant skills, then compose a day-by-day
itinerary that accounts for weather conditions. If it rains, suggest indoor
activities. If sunny, suggest outdoor options.

Keep responses concise and well-formatted."""

def create_agent(tools):
    model = ChatAnthropic(model='claude-sonnet-4-20250514')
    checkpointer = MemorySaver()
    return create_react_agent(model, tools, prompt=SYSTEM_PROMPT, checkpointer=checkpointer)
```

### Key: contextId → thread_id mapping

```python
# In main.py, when calling the agent:
config = {'configurable': {'thread_id': context_id or str(uuid4())}}
result = await agent.ainvoke({'messages': [('user', text)]}, config)
```

---

## Fase 4: Chat UI (15 min)

### Streamlit App (chat-ui/app.py)

```python
import streamlit as st
import requests

st.set_page_config(page_title='Travel Planner', layout='wide')

# Sidebar: A2A activity log
with st.sidebar:
    st.header('A2A Activity')
    if 'activity_log' in st.session_state:
        for entry in st.session_state.activity_log:
            st.write(f"{'✅' if entry['status'] == 'completed' else '⏳'} {entry['skill']}")

# Main chat
st.title('Weekend Escape Planner')

if 'messages' not in st.session_state:
    st.session_state.messages = []
    st.session_state.context_id = None

for msg in st.session_state.messages:
    with st.chat_message(msg['role']):
        st.markdown(msg['content'])

if prompt := st.chat_input('Where do you want to go?'):
    st.session_state.messages.append({'role': 'user', 'content': prompt})
    with st.chat_message('user'):
        st.markdown(prompt)

    with st.chat_message('assistant'):
        with st.spinner('Planning your trip...'):
            resp = requests.post('http://localhost:8000/message', json={
                'text': prompt,
                'context_id': st.session_state.context_id
            })
            data = resp.json()
            st.markdown(data['response'])
            st.session_state.context_id = data['context_id']
            st.session_state.activity_log = data.get('activity_log', [])

    st.session_state.messages.append({'role': 'assistant', 'content': data['response']})
    st.rerun()
```

---

## Fase 5: Demo Script (ensayar 2+ veces)

### Narrativa (3 min)

| Tiempo | Acción | Lo que dices |
|--------|--------|-------------|
| 0:00 | Abrir chat UI | "Nuestro sistema usa dos agentes A2A: un consumer que razona y un provider con 5 skills de viajes" |
| 0:15 | Escribir "Plan a weekend in Barcelona this Friday" | "El consumer descubre al provider via Agent Card y decide qué skills necesita" |
| 0:20 | Señalar sidebar | "Aquí vemos las 5 llamadas A2A en tiempo real: clima, vuelos, hotel, restaurantes, actividades" |
| 0:40 | Leer el itinerario | "Fijaos: como llueve el sábado, sugiere museos por la mañana. El domingo con sol, actividades al aire libre" |
| 1:00 | Escribir "change the hotel to something cheaper" | "Multi-turn: el consumer recuerda el contexto y solo re-consulta la skill de hoteles" |
| 1:20 | Señalar sidebar | "Solo una llamada A2A esta vez, no cinco" |
| 1:30 | Escribir "book the hotel" | "CRUD completo: booking via A2A, el provider devuelve confirmación" |
| 1:45 | Mostrar terminal del provider | "Aquí se ven las peticiones JSON-RPC entrando al provider" |
| 2:00 | Abrir `localhost:3000/.well-known/agent-card.json` | "Agent Card estándar A2A con las 5 skills" |
| 2:15 | Explicar arquitectura | "Consumer en Python/LangGraph, Provider en TypeScript/Express, comunicación 100% A2A protocol" |
| 2:30 | Fin. Preguntas | |

### Queries de backup (si algo falla)

```
"What's the weather in Madrid this weekend?"      → Solo 1 skill, rápido
"Find restaurants near Sol in Madrid"               → Solo 1 skill, rápido
"Plan a trip to Sevilla"                            → Full flow, destino diferente
```

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| Provider no arranca | `npm install` de nuevo. Verificar que `tsx` está instalado |
| Consumer no descubre provider | Verificar que provider corre en :3000. `curl http://localhost:3000/.well-known/agent-card.json` |
| A2A message/send falla | Verificar JSON-RPC format. El endpoint es `/` (root), no `/a2a` |
| Amadeus OAuth falla | Cambiar a mock. En `.env`: dejar `AMADEUS_API_KEY` vacío |
| LLM no llama tools | Revisar system prompt — debe incluir keywords explícitos |
| Multi-turn no funciona | Verificar que `context_id` se devuelve al chat UI y se reenvía |
| Streamlit no actualiza | `st.rerun()` después de cada respuesta |

---

## Adaptación el día del hackathon

Si el briefing cambia algo:

| Cambio | Qué tocar |
|--------|-----------|
| Otro dominio (no viajes) | Cambiar skills en provider + system prompt en consumer |
| Otra API | Nuevo archivo en `skills/`, registrar keywords en router |
| Orca da su propio UI | Desconectar Streamlit, apuntar Orca a `POST localhost:8000/message` |
| Piden Python en provider | Reescribir provider con `a2a-sdk` Python (ver docs/a2a-research.md §9.3) |
| Piden streaming | Cambiar `message/send` → `message/stream` en ambos lados |
