import { geocode } from './geocoding.js'

const FALLBACK_RESTAURANTS: Record<string, string[]> = {
  madrid: ['Sobrino de Botín', 'La Barraca', 'Casa Lucio', 'StreetXO', 'Lateral', 'El Club Allard', 'Taberna La Concha', 'Mercado de San Miguel', 'La Musa', 'Café de Oriente'],
  barcelona: ['Cal Pep', 'Tickets Bar', 'Can Culleretes', 'Els Quatre Gats', 'La Boqueria', 'Cervecería Catalana', 'Bar Mut', 'Flax & Kale', 'Bodega 1900', 'Dos Palillos'],
  default: ['Local Restaurant 1', 'Local Restaurant 2', 'Local Restaurant 3', 'Local Restaurant 4', 'Local Restaurant 5'],
}

export async function searchRestaurants(query: string): Promise<string> {
  const city = extractCity(query)
  if (!city) return 'Could not determine the city. Please specify a city name.'

  const geo = await geocode(city)
  if (!geo) return `Could not find "${city}".`

  try {
    const overpassQuery = `[out:json];area[name="${city}"]->.a;node(area.a)["amenity"="restaurant"](if:t["name"]!="");out 10;`
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json() as { elements: Array<{ tags: { name?: string; cuisine?: string } }> }

    if (data.elements.length > 0) {
      const restaurants = data.elements
        .filter(e => e.tags?.name)
        .map(e => {
          const cuisine = e.tags.cuisine ? ` (${e.tags.cuisine})` : ''
          return `${e.tags.name}${cuisine}`
        })

      return `Restaurants in ${city}:\n${restaurants.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`
    }
  } catch {
    // Overpass timeout or error — use fallback
  }

  const key = city.toLowerCase()
  const list = FALLBACK_RESTAURANTS[key] ?? FALLBACK_RESTAURANTS.default
  return `Restaurants in ${city}:\n${list.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`
}

function extractCity(query: string): string | null {
  const patterns = [
    /restaurants? (?:in|for|at|near) (.+?)(?:\?|$|\.|,)/i,
    /(?:eat|food|dining) (?:in|at|near) (.+?)(?:\?|$|\.|,)/i,
    /(?:in|for|at|near) (.+?)(?:\?|$|\.|,)/i,
  ]
  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}
