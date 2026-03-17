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

# 3. SerpAPI Google Flights (gratis 250 búsquedas/mes)
#    https://serpapi.com/users/sign_up → Dashboard → API key
SERPAPI_API_KEY=xxx

# 4. Ticketmaster (gratis 5000 calls/día)
#    https://developer.ticketmaster.com/ → My Apps → Create → Consumer Key
TICKETMASTER_API_KEY=xxx

# 5. Anthropic (para el consumer LLM)
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
curl "https://api.openweathermap.org/data/2.5/forecast?q=Madrid&appid=$OPENWEATHER_API_KEY&units=metric&cnt=3"

# Google Places
curl -X POST "https://places.googleapis.com/v1/places:searchNearby" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
  -H "X-Goog-FieldMask: places.displayName,places.rating" \
  -d '{"locationRestriction":{"circle":{"center":{"latitude":40.4168,"longitude":-3.7038},"radius":1000}},"includedTypes":["restaurant"],"maxResultCount":3}'

# SerpAPI Google Flights
curl "https://serpapi.com/search.json?engine=google_flights&departure_id=MAD&arrival_id=BCN&outbound_date=2026-03-20&type=2&currency=EUR&api_key=$SERPAPI_API_KEY"

# Ticketmaster
curl "https://app.ticketmaster.com/discovery/v2/events.json?city=Barcelona&size=3&apikey=$TICKETMASTER_API_KEY"
```

---

## Lo que ya está construido

```
provider-agent/          ← TypeScript/Express, 6 A2A skills
├── src/
│   ├── index.ts         # Express + A2A handler + skill registration
│   ├── agent-card.ts    # Agent Card con 6 skills
│   ├── executor.ts      # A2A executor (routes → skills → artifacts)
│   ├── router.ts        # Keyword-based routing
│   └── skills/
│       ├── cities.ts    # Shared: 14 EU cities, coords, IATA codes
│       ├── weather.ts   # OpenWeatherMap (real + mock)
│       ├── flights.ts   # SerpAPI Google Flights (real + mock + booking)
│       ├── hotels.ts    # Mock data + booking/cancellation
│       ├── restaurants.ts # Google Places (real + mock)
│       ├── activities.ts  # Google Places (real + mock)
│       └── events.ts   # Ticketmaster (real + mock)

consumer-agent/          ← Python/LangGraph, 7 tools
├── main.py              # FastAPI POST /message + /health
├── agent.py             # create_react_agent + system prompt
├── a2a_client.py        # A2A discovery + message sender (cached card)
└── tools.py             # 7 async tools delegating to provider via A2A

chat-ui/                 ← Streamlit
├── app.py               # Chat UI + A2A activity log sidebar
└── requirements.txt

start.sh                 # Launches all 3 components
```

### APIs integradas

| Skill | API | Datos | Key env var |
|-------|-----|-------|-------------|
| weather | OpenWeatherMap | Real + mock fallback | `OPENWEATHER_API_KEY` |
| flights | SerpAPI Google Flights | Real + mock + booking | `SERPAPI_API_KEY` |
| restaurants | Google Places | Real + mock fallback | `GOOGLE_PLACES_API_KEY` |
| activities | Google Places | Real + mock fallback | `GOOGLE_PLACES_API_KEY` |
| events | Ticketmaster | Real + mock fallback | `TICKETMASTER_API_KEY` |
| hotels | Curated mock | Mock + booking/cancel | (ninguna) |

### Key features

- **6 A2A skills** en el provider (5 APIs reales + 1 mock)
- **7 LangChain tools** en el consumer (6 search + 1 book)
- **Multi-turn**: contextId tracking, MemorySaver checkpointer
- **Booking/cancellation**: Hotels y flights devuelven confirmación
- **Weather-aware itineraries**: indoor cuando llueve, outdoor con sol
- **Activity log sidebar**: muestra las 6 llamadas A2A al provider
- **Mock fallback**: todos los skills funcionan sin API keys
- **Agent timeout**: 90s máximo para evitar cuelgues en demo

---

## Timeline del hackathon (2 horas)

```
MINUTO    DEV 1 (TypeScript/Provider)           DEV 2 (Python/Consumer)
═══════   ══════════════════════════════         ═══════════════════════════
 0-10     Setup proyecto + dependencias          Setup proyecto + dependencias
10-25     A2A server + Agent Card + 1 skill      A2A client + discovery
25-35     ── CHECKPOINT 1: consumer llama provider via A2A ──
35-55     Añadir skills (hotels, restaurants)     ReAct agent + tools + system prompt
55-70     Añadir skills (activities, events)      FastAPI /message endpoint
70-85     Flights + booking + console logging     Streamlit chat UI + activity log
85-100    ── CHECKPOINT 2: demo completa E2E ──
100-110   Polish: test multi-turn, booking       Polish: prompts, UX
110-120   ── ENSAYO DE DEMO (2 veces mínimo) ──
```

### Checkpoints críticos

- **Minuto 25**: Consumer puede enviar `message/send` al provider y recibir respuesta. Si esto no funciona, PARA todo y arréglalo.
- **Minuto 85**: Demo completa funciona end-to-end. Si no estás aquí, recorta scope.
- **Minuto 110**: Si no has ensayado la demo, deja de programar AHORA.

---

## Arrancar todo

```bash
# Opción 1: script automático
./start.sh

# Opción 2: manual (3 terminales)
# Terminal 1 — Provider
cd provider-agent && npm run dev          # localhost:3000

# Terminal 2 — Consumer
cd consumer-agent && source .venv/bin/activate && python main.py  # localhost:8000

# Terminal 3 — Chat UI
cd chat-ui && pip install -r requirements.txt && streamlit run app.py  # localhost:8501
```

### Verificar que todo funciona

```bash
# Agent Card (6 skills)
curl -s http://localhost:3000/.well-known/agent-card.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d[\"name\"]}: {len(d[\"skills\"])} skills'); [print(f'  - {s[\"id\"]}') for s in d['skills']]"

# Consumer health
curl http://localhost:8000/health

# Full E2E test
curl -s -X POST http://localhost:8000/message \
  -H "Content-Type: application/json" \
  -d '{"text":"Plan a weekend in Barcelona"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['response'][:500]); print(f'\nActivity: {len(d[\"activity_log\"])} A2A calls')"
```

---

## Demo Script (ensayar 2+ veces)

### Narrativa (3 min)

| Tiempo | Acción | Lo que dices |
|--------|--------|-------------|
| 0:00 | Abrir chat UI + terminal provider visible | "Dos agentes A2A: consumer en Python/LangGraph, provider en TypeScript/Express con 6 skills de viajes" |
| 0:15 | Escribir "Plan a weekend in Barcelona" | "El consumer descubre al provider via Agent Card y decide qué skills necesita" |
| 0:20 | Señalar sidebar | "6 llamadas A2A al provider: clima, vuelos, hoteles, restaurantes, actividades y **eventos reales** de Ticketmaster" |
| 0:40 | Leer el itinerario | "El itinerario es weather-aware: si llueve sugiere museos, con sol actividades al aire libre. Incluye eventos reales del fin de semana" |
| 1:00 | Escribir "change the hotel to something cheaper" | "Multi-turn: el consumer recuerda el contexto. Solo re-consulta la skill de hoteles, no las 6" |
| 1:20 | Señalar sidebar | "Solo 1 llamada A2A esta vez" |
| 1:30 | Escribir "book the hotel" | "CRUD completo: booking via A2A. El provider devuelve número de confirmación" |
| 1:45 | Señalar terminal del provider | "Aquí se ven los JSON-RPC requests entrando al provider: skill routing, task completion" |
| 2:00 | Abrir `localhost:3000/.well-known/agent-card.json` | "Agent Card estándar A2A v0.3 con 6 skills" |
| 2:15 | Explicar arquitectura | "5 APIs reales (OpenWeather, Google Flights, Google Places x2, Ticketmaster), protocolo A2A puro, todo en local" |
| 2:30 | Fin. Preguntas | |

### Queries de backup (si algo falla)

```
"What's the weather in Madrid this weekend?"      → 1 skill, rápido
"Find restaurants near Sol in Madrid"               → 1 skill, rápido
"What events are on in Valencia?"                   → 1 skill, eventos
"Plan a trip to Sevilla"                            → Full flow, destino diferente
```

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| Provider no arranca | `cd provider-agent && npm install` de nuevo |
| Consumer no descubre provider | Verificar provider en :3000. `curl http://localhost:3000/.well-known/agent-card.json` |
| A2A message/send falla | El endpoint JSON-RPC es `/` (root), no `/a2a` |
| LLM no llama tools | Revisar system prompt — tiene "MUST call tools immediately" |
| LLM llama tools 2 veces | El prompt tiene "Call tools ONCE. Never call a second time" |
| Multi-turn no funciona | Verificar que `context_id` se devuelve al chat UI y se reenvía |
| Streamlit no actualiza | `st.rerun()` después de cada respuesta |
| Timeout (>90s) | Alguna API está lenta. Quitar la API key para usar mock fallback |
| OpenWeather 404 | Ciudad no reconocida. Las 14 ciudades soportadas están en `cities.ts` |
| Puerto ocupado | `lsof -ti:3000 | xargs kill -9` (o :8000, :8501) |

---

## Adaptación el día del hackathon

Si el briefing cambia algo:

| Cambio | Qué tocar |
|--------|-----------|
| Otro dominio (no viajes) | Cambiar skills en provider + system prompt en consumer |
| Otra API | Nuevo archivo en `skills/`, añadir ciudad en `cities.ts`, registrar keywords en `index.ts` |
| Más ciudades | Añadir a `cities.ts` (coords, IATA) + mock data en skills relevantes |
| Orca da su propio UI | Desconectar Streamlit, apuntar Orca a `POST localhost:8000/message` |
| Piden Python en provider | Reescribir provider con `a2a-sdk` Python (ver docs/a2a-research.md §9.3) |
| Piden streaming | Cambiar `message/send` → `message/stream` en ambos lados |
| Nuevo skill | Copiar `activities.ts` como template, registrar en `index.ts`, añadir tool en `tools.py` |
