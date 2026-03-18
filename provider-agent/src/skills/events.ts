import type { SkillHandler } from './types.js'
import { extractCity } from './cities.js'

interface EventEntry {
  name: string
  venue: string
  date: string
  time: string
  price_min: number | null
  price_max: number | null
  currency: string
  category: string
  url?: string
}

const MOCK_DATA: Record<string, EventEntry[]> = {
  madrid: [
    { name: 'Real Madrid vs Atlético Madrid', venue: 'Santiago Bernabéu', date: '2026-03-20', time: '21:00', price_min: 45, price_max: 195, currency: 'EUR', category: 'Sports', url: 'https://www.google.com/maps/search/Santiago+Bernabéu+Madrid' },
    { name: 'Rosalía - Motomami World Tour', venue: 'WiZink Center', date: '2026-03-21', time: '20:30', price_min: 35, price_max: 120, currency: 'EUR', category: 'Music', url: 'https://www.google.com/maps/search/WiZink+Center+Madrid' },
    { name: 'El Fantasma de la Ópera', venue: 'Teatro Lope de Vega', date: '2026-03-20', time: '20:00', price_min: 25, price_max: 85, currency: 'EUR', category: 'Arts & Theatre', url: 'https://www.google.com/maps/search/Teatro+Lope+de+Vega+Madrid' },
  ],
  barcelona: [
    { name: 'FC Barcelona vs Real Sociedad', venue: 'Spotify Camp Nou', date: '2026-03-21', time: '21:00', price_min: 55, price_max: 250, currency: 'EUR', category: 'Sports', url: 'https://www.google.com/maps/search/Camp+Nou+Barcelona' },
    { name: 'Coldplay - Music of the Spheres', venue: 'Estadi Olímpic', date: '2026-03-20', time: '21:00', price_min: 65, price_max: 180, currency: 'EUR', category: 'Music', url: 'https://www.google.com/maps/search/Estadi+Olímpic+Barcelona' },
    { name: 'Flamenco Night', venue: 'Palau de la Música', date: '2026-03-20', time: '19:30', price_min: 30, price_max: 60, currency: 'EUR', category: 'Arts & Theatre', url: 'https://www.google.com/maps/search/Palau+de+la+Música+Barcelona' },
  ],
  valencia: [
    { name: 'Valencia CF vs Villarreal', venue: 'Mestalla', date: '2026-03-21', time: '18:30', price_min: 30, price_max: 120, currency: 'EUR', category: 'Sports', url: 'https://www.google.com/maps/search/Mestalla+Valencia' },
    { name: 'Aitana - Alpha Tour', venue: 'Palau de les Arts', date: '2026-03-20', time: '21:00', price_min: 40, price_max: 95, currency: 'EUR', category: 'Music', url: 'https://www.google.com/maps/search/Palau+de+les+Arts+Valencia' },
    { name: 'Las Fallas Night Show', venue: 'Plaza del Ayuntamiento', date: '2026-03-19', time: '00:00', price_min: 0, price_max: 0, currency: 'EUR', category: 'Festival', url: 'https://www.google.com/maps/search/Plaza+del+Ayuntamiento+Valencia' },
  ],
  lisbon: [
    { name: 'Benfica vs Porto', venue: 'Estádio da Luz', date: '2026-03-21', time: '20:00', price_min: 25, price_max: 90, currency: 'EUR', category: 'Sports', url: 'https://www.google.com/maps/search/Estádio+da+Luz+Lisbon' },
    { name: 'Fado Night - Ana Moura', venue: 'Casa da Música', date: '2026-03-20', time: '21:30', price_min: 20, price_max: 55, currency: 'EUR', category: 'Music', url: 'https://www.google.com/maps/search/Casa+da+Música+Lisbon' },
  ],
  sevilla: [
    { name: 'Sevilla FC vs Real Betis', venue: 'Ramón Sánchez-Pizjuán', date: '2026-03-21', time: '21:00', price_min: 35, price_max: 150, currency: 'EUR', category: 'Sports', url: 'https://www.google.com/maps/search/Ramón+Sánchez-Pizjuán+Sevilla' },
    { name: 'Flamenco Puro - Sara Baras', venue: 'Teatro de la Maestranza', date: '2026-03-20', time: '20:00', price_min: 25, price_max: 70, currency: 'EUR', category: 'Arts & Theatre', url: 'https://www.google.com/maps/search/Teatro+de+la+Maestranza+Sevilla' },
  ],
}

function getWeekendDates(): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
  const friday = new Date(now)
  friday.setDate(now.getDate() + daysUntilFriday)
  const sunday = new Date(friday)
  sunday.setDate(friday.getDate() + 2)

  return {
    start: `${friday.toISOString().split('T')[0]}T00:00:00Z`,
    end: `${sunday.toISOString().split('T')[0]}T23:59:59Z`,
  }
}

export const eventsHandler: SkillHandler = async (message) => {
  const city = extractCity(message)
  const apiKey = process.env.TICKETMASTER_API_KEY

  let events: EventEntry[]

  if (apiKey) {
    try {
      const { start, end } = getWeekendDates()
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(city)}&startDateTime=${start}&endDateTime=${end}&size=5&sort=date,asc&apikey=${apiKey}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Ticketmaster API returned ${response.status}`)
      }

      const data = await response.json() as {
        _embedded?: {
          events: Array<{
            name: string
            url: string
            dates: { start: { localDate: string; localTime?: string } }
            _embedded?: { venues: Array<{ name: string }> }
            priceRanges?: Array<{ min: number; max: number; currency: string }>
            classifications?: Array<{ segment: { name: string } }>
          }>
        }
      }

      if (data._embedded?.events) {
        events = data._embedded.events.map(e => ({
          name: e.name,
          venue: e._embedded?.venues?.[0]?.name || 'TBA',
          date: e.dates.start.localDate,
          time: e.dates.start.localTime || 'TBA',
          price_min: e.priceRanges?.[0]?.min || null,
          price_max: e.priceRanges?.[0]?.max || null,
          currency: e.priceRanges?.[0]?.currency || 'EUR',
          category: e.classifications?.[0]?.segment?.name || 'Event',
          url: e.url || '',
        }))
      } else {
        // No events found in API, use mock
        const cityKey = city.toLowerCase()
        events = MOCK_DATA[cityKey] || MOCK_DATA['madrid']!
      }

      const displayCity = city.charAt(0).toUpperCase() + city.slice(1)
      const summary = events
        .map(e => {
          const price = e.price_min != null ? `${e.price_min}-${e.price_max} ${e.currency}` : 'Free/TBA'
          const link = e.url ? ` | Link: ${e.url}` : ''
          return `  ${e.date} ${e.time} | ${e.name} | ${e.venue} | ${price} (${e.category})${link}`
        })
        .join('\n')

      return {
        text: `Events in ${displayCity} this weekend:\n${summary}`,
        data: { city: displayCity, events },
      }
    } catch (err) {
      console.warn(`Ticketmaster API error, falling back to mock data: ${err}`)
    }
  }

  // Mock fallback
  const cityKey = city.toLowerCase()
  events = MOCK_DATA[cityKey] || MOCK_DATA['madrid']!
  const displayCity = city.charAt(0).toUpperCase() + city.slice(1)

  const summary = events
    .map(e => {
      const price = e.price_min != null && e.price_min > 0 ? `${e.price_min}-${e.price_max} ${e.currency}` : 'Free'
      return `  ${e.date} ${e.time} | ${e.name} | ${e.venue} | ${price} (${e.category})`
    })
    .join('\n')

  return {
    text: `Events in ${displayCity} this weekend:\n${summary}`,
    data: { city: displayCity, events },
  }
}
