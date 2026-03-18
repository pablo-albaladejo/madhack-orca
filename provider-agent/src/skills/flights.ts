interface Flight {
  id: string
  airline: string
  from: string
  to: string
  departure: string
  arrival: string
  price: string
  duration: string
}

const MOCK_FLIGHTS: Record<string, Flight[]> = {
  'barcelona-madrid': [
    { id: 'IB3214', airline: 'Iberia', from: 'BCN', to: 'MAD', departure: '08:30', arrival: '09:55', price: '€89', duration: '1h 25m' },
    { id: 'VY1002', airline: 'Vueling', from: 'BCN', to: 'MAD', departure: '11:15', arrival: '12:40', price: '€62', duration: '1h 25m' },
    { id: 'FR5521', airline: 'Ryanair', from: 'BCN', to: 'MAD', departure: '14:00', arrival: '15:30', price: '€35', duration: '1h 30m' },
  ],
  'london-madrid': [
    { id: 'BA460', airline: 'British Airways', from: 'LHR', to: 'MAD', departure: '09:00', arrival: '12:30', price: '€145', duration: '2h 30m' },
    { id: 'IB3167', airline: 'Iberia', from: 'LHR', to: 'MAD', departure: '13:45', arrival: '17:15', price: '€128', duration: '2h 30m' },
  ],
  'paris-madrid': [
    { id: 'AF1300', airline: 'Air France', from: 'CDG', to: 'MAD', departure: '10:20', arrival: '12:35', price: '€112', duration: '2h 15m' },
    { id: 'IB3443', airline: 'Iberia', from: 'CDG', to: 'MAD', departure: '16:00', arrival: '18:10', price: '€98', duration: '2h 10m' },
  ],
  'default': [
    { id: 'XX100', airline: 'SkyTravel', from: '???', to: '???', departure: '09:00', arrival: '11:30', price: '€120', duration: '2h 30m' },
    { id: 'XX200', airline: 'AirConnect', from: '???', to: '???', departure: '15:00', arrival: '17:45', price: '€85', duration: '2h 45m' },
  ],
}

export async function searchFlights(query: string): Promise<string> {
  const { from, to } = extractCities(query)
  if (!to) return 'Could not determine the destination. Please specify origin and destination cities.'

  const key = from ? `${from.toLowerCase()}-${to.toLowerCase()}` : 'default'
  const flights = MOCK_FLIGHTS[key] ?? MOCK_FLIGHTS.default!

  const updated = flights.map(f => ({
    ...f,
    from: from ? f.from : 'ORG',
    to: f.to === '???' ? to.substring(0, 3).toUpperCase() : f.to,
  }))

  let result = `Flights${from ? ` from ${from}` : ''} to ${to}:\n\n`
  for (const f of updated) {
    result += `  ${f.id} | ${f.airline} | ${f.from}→${f.to} | ${f.departure}–${f.arrival} | ${f.duration} | ${f.price}\n`
  }
  return result
}

function extractCities(query: string): { from: string | null; to: string | null } {
  const fromTo = query.match(/from\s+(\w+(?:\s+\w+)?)\s+to\s+(\w+(?:\s+\w+)?)/i)
  if (fromTo) return { from: fromTo[1], to: fromTo[2] }

  const toOnly = query.match(/(?:to|for|in)\s+(\w+(?:\s+\w+)?)/i)
  if (toOnly) return { from: null, to: toOnly[1] }

  return { from: null, to: null }
}
