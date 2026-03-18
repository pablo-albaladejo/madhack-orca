interface Hotel {
  id: string
  name: string
  location: string
  rating: number
  pricePerNight: string
  amenities: string[]
}

const MOCK_HOTELS: Record<string, Hotel[]> = {
  madrid: [
    { id: 'HTL-MAD-01', name: 'Hotel Gran Via', location: 'Gran Via 21, Madrid', rating: 4.3, pricePerNight: '€95', amenities: ['WiFi', 'AC', 'Breakfast'] },
    { id: 'HTL-MAD-02', name: 'Hostal Madrid Sol', location: 'Puerta del Sol 14, Madrid', rating: 4.1, pricePerNight: '€72', amenities: ['WiFi', 'AC'] },
    { id: 'HTL-MAD-03', name: 'NH Collection Palacio', location: 'Plaza de Cánovas, Madrid', rating: 4.6, pricePerNight: '€155', amenities: ['WiFi', 'AC', 'Spa', 'Gym', 'Breakfast'] },
  ],
  barcelona: [
    { id: 'HTL-BCN-01', name: 'Hotel Arts Barcelona', location: 'Marina 19-21, Barcelona', rating: 4.7, pricePerNight: '€210', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'] },
    { id: 'HTL-BCN-02', name: 'Hostal Grau', location: 'Ramelleres 27, Barcelona', rating: 4.0, pricePerNight: '€65', amenities: ['WiFi', 'AC'] },
    { id: 'HTL-BCN-03', name: 'Hotel 1898', location: 'La Rambla 109, Barcelona', rating: 4.4, pricePerNight: '€130', amenities: ['WiFi', 'AC', 'Rooftop Pool'] },
  ],
  default: [
    { id: 'HTL-GEN-01', name: 'City Center Hotel', location: 'Downtown', rating: 4.2, pricePerNight: '€90', amenities: ['WiFi', 'AC', 'Breakfast'] },
    { id: 'HTL-GEN-02', name: 'Budget Inn', location: 'City Center', rating: 3.8, pricePerNight: '€55', amenities: ['WiFi'] },
  ],
}

export async function searchHotels(query: string): Promise<string> {
  const city = extractCity(query)
  if (!city) return 'Could not determine the city. Please specify a city name.'

  const key = city.toLowerCase()
  const hotels = MOCK_HOTELS[key] ?? MOCK_HOTELS.default!

  let result = `Hotels in ${city}:\n\n`
  for (const h of hotels) {
    result += `  ${h.id} | ${h.name} | ★${h.rating} | ${h.pricePerNight}/night\n`
    result += `    ${h.location} | ${h.amenities.join(', ')}\n\n`
  }
  return result
}

function extractCity(query: string): string | null {
  const patterns = [
    /hotels? (?:in|for|at|near) (.+?)(?:\?|$|\.|,)/i,
    /accommodation (?:in|for|at|near) (.+?)(?:\?|$|\.|,)/i,
    /stay (?:in|at|near) (.+?)(?:\?|$|\.|,)/i,
    /(?:in|for|at|near) (.+?)(?:\?|$|\.|,)/i,
  ]
  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}
