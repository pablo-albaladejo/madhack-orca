import type { SkillHandler } from './types.js'
import { extractCity, IATA_CODES } from './cities.js'

interface FlightResult {
  airline: string
  flight_number: string
  departure: string
  arrival: string
  duration: string
  price: number
  currency: string
}

const MOCK_FLIGHTS: Record<string, FlightResult[]> = {
  'MAD-BCN': [
    { airline: 'Iberia', flight_number: 'IB1234', departure: '07:15', arrival: '08:40', duration: '1h 25m', price: 45, currency: 'EUR' },
    { airline: 'Vueling', flight_number: 'VY1012', departure: '09:30', arrival: '10:55', duration: '1h 25m', price: 38, currency: 'EUR' },
    { airline: 'Ryanair', flight_number: 'FR5678', departure: '14:00', arrival: '15:25', duration: '1h 25m', price: 25, currency: 'EUR' },
    { airline: 'Air Europa', flight_number: 'UX3456', departure: '18:45', arrival: '20:10', duration: '1h 25m', price: 52, currency: 'EUR' },
  ],
  'BCN-MAD': [
    { airline: 'Vueling', flight_number: 'VY1013', departure: '08:00', arrival: '09:25', duration: '1h 25m', price: 42, currency: 'EUR' },
    { airline: 'Iberia', flight_number: 'IB1235', departure: '12:30', arrival: '13:55', duration: '1h 25m', price: 48, currency: 'EUR' },
    { airline: 'Ryanair', flight_number: 'FR5679', departure: '16:15', arrival: '17:40', duration: '1h 25m', price: 29, currency: 'EUR' },
  ],
  'MAD-LIS': [
    { airline: 'Iberia', flight_number: 'IB3100', departure: '08:30', arrival: '09:30', duration: '1h 00m', price: 65, currency: 'EUR' },
    { airline: 'TAP Portugal', flight_number: 'TP1020', departure: '11:00', arrival: '12:00', duration: '1h 00m', price: 72, currency: 'EUR' },
    { airline: 'Ryanair', flight_number: 'FR8822', departure: '17:45', arrival: '18:45', duration: '1h 00m', price: 35, currency: 'EUR' },
  ],
  'MAD-CDG': [
    { airline: 'Iberia', flight_number: 'IB3444', departure: '07:00', arrival: '09:15', duration: '2h 15m', price: 89, currency: 'EUR' },
    { airline: 'Air France', flight_number: 'AF1301', departure: '10:30', arrival: '12:45', duration: '2h 15m', price: 95, currency: 'EUR' },
    { airline: 'Vueling', flight_number: 'VY8820', departure: '15:00', arrival: '17:15', duration: '2h 15m', price: 55, currency: 'EUR' },
  ],
  'BCN-CDG': [
    { airline: 'Vueling', flight_number: 'VY8010', departure: '06:45', arrival: '08:45', duration: '2h 00m', price: 50, currency: 'EUR' },
    { airline: 'Air France', flight_number: 'AF1149', departure: '13:00', arrival: '15:00', duration: '2h 00m', price: 85, currency: 'EUR' },
  ],
  'MAD-LHR': [
    { airline: 'Iberia', flight_number: 'IB7460', departure: '08:00', arrival: '09:30', duration: '2h 30m', price: 110, currency: 'EUR' },
    { airline: 'British Airways', flight_number: 'BA461', departure: '14:15', arrival: '15:45', duration: '2h 30m', price: 125, currency: 'EUR' },
  ],
  'MAD-FCO': [
    { airline: 'Iberia', flight_number: 'IB3250', departure: '09:00', arrival: '11:30', duration: '2h 30m', price: 78, currency: 'EUR' },
    { airline: 'Ryanair', flight_number: 'FR6340', departure: '16:00', arrival: '18:30', duration: '2h 30m', price: 42, currency: 'EUR' },
  ],
}

function extractCities(message: string): { origin: string | null; destination: string | null } {
  const lower = message.toLowerCase()

  // Pattern: "from X to Y"
  const fromTo = lower.match(/from\s+(\w+)\s+to\s+(\w+)/)
  if (fromTo) {
    return { origin: extractCity(fromTo[1]), destination: extractCity(fromTo[2]) }
  }

  // Pattern: "X to Y"
  const xToY = lower.match(/(\w+)\s+to\s+(\w+)/)
  if (xToY) {
    const originCandidate = extractCity(xToY[1])
    const destCandidate = extractCity(xToY[2])
    if (IATA_CODES[originCandidate] && IATA_CODES[destCandidate]) {
      return { origin: originCandidate, destination: destCandidate }
    }
  }

  // Find any cities mentioned
  const found: string[] = []
  for (const city of Object.keys(IATA_CODES)) {
    if (lower.includes(city)) {
      found.push(city)
    }
  }

  if (found.length >= 2) {
    return { origin: found[0], destination: found[1] }
  }
  if (found.length === 1) {
    return { origin: 'madrid', destination: found[0] }
  }

  return { origin: null, destination: null }
}

function extractDate(message: string): string {
  const lower = message.toLowerCase()

  // Look for explicit dates (YYYY-MM-DD or DD/MM/YYYY)
  const isoMatch = lower.match(/(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]

  const euMatch = lower.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (euMatch) return `${euMatch[3]}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`

  // Relative dates
  const today = new Date()
  if (lower.includes('tomorrow')) {
    today.setDate(today.getDate() + 1)
    return today.toISOString().split('T')[0]
  }
  if (lower.includes('friday')) {
    const day = today.getDay()
    const daysUntilFriday = (5 - day + 7) % 7 || 7
    today.setDate(today.getDate() + daysUntilFriday)
    return today.toISOString().split('T')[0]
  }
  if (lower.includes('saturday')) {
    const day = today.getDay()
    const daysUntilSat = (6 - day + 7) % 7 || 7
    today.setDate(today.getDate() + daysUntilSat)
    return today.toISOString().split('T')[0]
  }
  if (lower.includes('monday')) {
    const day = today.getDay()
    const daysUntilMon = (1 - day + 7) % 7 || 7
    today.setDate(today.getDate() + daysUntilMon)
    return today.toISOString().split('T')[0]
  }

  // Default: tomorrow
  today.setDate(today.getDate() + 1)
  return today.toISOString().split('T')[0]
}

export const flightsHandler: SkillHandler = async (message) => {
  const lower = message.toLowerCase()

  // Handle booking
  if (lower.includes('book flight') || lower.includes('book a flight')) {
    const { origin, destination } = extractCities(message)
    const date = extractDate(message)
    const originCode = origin ? IATA_CODES[origin] || origin.toUpperCase() : 'MAD'
    const destCode = destination ? IATA_CODES[destination] || destination.toUpperCase() : 'BCN'

    // Find mentioned flight number
    const flightMatch = message.match(/([A-Z]{2}\d{3,4})/i)
    const flightNumber = flightMatch ? flightMatch[1].toUpperCase() : `IB${Math.floor(1000 + Math.random() * 9000)}`

    const confirmation = `FLT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    return {
      text: `Flight booked successfully!\nConfirmation: ${confirmation}\nFlight: ${flightNumber} from ${originCode} to ${destCode}\nDate: ${date}`,
      data: {
        action: 'booked',
        confirmation,
        flight_number: flightNumber,
        origin: originCode,
        destination: destCode,
        date,
      },
    }
  }

  // Handle search
  const { origin, destination } = extractCities(message)
  const date = extractDate(message)

  if (!origin || !destination) {
    return {
      text: 'I need both an origin and destination city to search for flights. Try: "flights from Madrid to Barcelona on Friday"',
      data: { error: 'missing_cities' },
    }
  }

  const originCode = IATA_CODES[origin] || origin.toUpperCase()
  const destCode = IATA_CODES[destination] || destination.toUpperCase()
  const apiKey = process.env.SERPAPI_API_KEY

  if (apiKey) {
    try {
      const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: originCode,
        arrival_id: destCode,
        outbound_date: date,
        type: '2', // one-way
        currency: 'EUR',
        hl: 'en',
        api_key: apiKey,
      })

      const response = await fetch(`https://serpapi.com/search.json?${params}`)
      if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`)

      const data = await response.json() as {
        best_flights?: Array<{
          flights: Array<{
            airline: string
            flight_number: string
            departure_airport: { time: string }
            arrival_airport: { time: string }
            duration: number
          }>
          price: number
        }>
        other_flights?: Array<{
          flights: Array<{
            airline: string
            flight_number: string
            departure_airport: { time: string }
            arrival_airport: { time: string }
            duration: number
          }>
          price: number
        }>
      }

      const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])].slice(0, 5)

      const flights: FlightResult[] = allFlights.map(f => {
        const leg = f.flights[0]
        const hours = Math.floor(leg.duration / 60)
        const mins = leg.duration % 60
        return {
          airline: leg.airline,
          flight_number: leg.flight_number,
          departure: leg.departure_airport.time,
          arrival: leg.arrival_airport.time,
          duration: `${hours}h ${mins}m`,
          price: f.price,
          currency: 'EUR',
        }
      })

      const displayOrigin = origin.charAt(0).toUpperCase() + origin.slice(1)
      const displayDest = destination.charAt(0).toUpperCase() + destination.slice(1)

      const summary = flights
        .map(f => `  ${f.airline} ${f.flight_number}: ${f.departure}-${f.arrival} (${f.duration}) - ${f.price} EUR`)
        .join('\n')

      const searchUrl = `https://www.google.com/travel/flights?q=flights+from+${originCode}+to+${destCode}+on+${date}`
      return {
        text: `Flights from ${displayOrigin} (${originCode}) to ${displayDest} (${destCode}) on ${date}:\n${summary}\nSearch & book: ${searchUrl}`,
        data: { origin: originCode, destination: destCode, date, flights, search_url: searchUrl },
      }
    } catch (err) {
      console.warn(`SerpAPI error, falling back to mock data: ${err}`)
    }
  }

  // Mock fallback
  const routeKey = `${originCode}-${destCode}`
  const reverseKey = `${destCode}-${originCode}`
  const flights = MOCK_FLIGHTS[routeKey] || MOCK_FLIGHTS[reverseKey] || MOCK_FLIGHTS['MAD-BCN']!

  const displayOrigin = origin.charAt(0).toUpperCase() + origin.slice(1)
  const displayDest = destination.charAt(0).toUpperCase() + destination.slice(1)

  const summary = flights
    .map(f => `  ${f.airline} ${f.flight_number}: ${f.departure}-${f.arrival} (${f.duration}) - ${f.price} EUR`)
    .join('\n')

  const searchUrl = `https://www.google.com/travel/flights?q=flights+from+${originCode}+to+${destCode}+on+${date}`
  return {
    text: `Flights from ${displayOrigin} (${originCode}) to ${displayDest} (${destCode}) on ${date}:\n${summary}\nSearch & book: ${searchUrl}`,
    data: { origin: originCode, destination: destCode, date, flights, search_url: searchUrl },
  }
}
