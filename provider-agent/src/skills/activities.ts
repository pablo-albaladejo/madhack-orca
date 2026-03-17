import type { SkillHandler } from './types.js'
import { extractCity, getCityCoords } from './cities.js'

interface Activity {
  name: string
  type: string
  rating: number
  address: string
}

const MOCK_ACTIVITIES: Record<string, Activity[]> = {
  madrid: [
    { name: 'Museo del Prado', type: 'Museum', rating: 4.7, address: 'Calle de Ruiz de Alarcon 23, Madrid' },
    { name: 'Museo Reina Sofia', type: 'Museum', rating: 4.6, address: 'Calle de Santa Isabel 52, Madrid' },
    { name: 'Royal Palace of Madrid', type: 'Tourist Attraction', rating: 4.7, address: 'Calle de Bailen, Madrid' },
    { name: 'Retiro Park', type: 'Park', rating: 4.8, address: 'Plaza de la Independencia 7, Madrid' },
    { name: 'Thyssen-Bornemisza Museum', type: 'Museum', rating: 4.6, address: 'Paseo del Prado 8, Madrid' },
    { name: 'Mercado de San Miguel', type: 'Tourist Attraction', rating: 4.3, address: 'Plaza de San Miguel, Madrid' },
  ],
  barcelona: [
    { name: 'Sagrada Familia', type: 'Tourist Attraction', rating: 4.8, address: 'Carrer de Mallorca 401, Barcelona' },
    { name: 'Park Guell', type: 'Park', rating: 4.6, address: 'Carrer Olot 5, Barcelona' },
    { name: 'MNAC (Museu Nacional d\'Art de Catalunya)', type: 'Museum', rating: 4.6, address: 'Palau Nacional, Parc de Montjuic, Barcelona' },
    { name: 'Casa Batllo', type: 'Tourist Attraction', rating: 4.7, address: 'Passeig de Gracia 43, Barcelona' },
    { name: 'La Boqueria Market', type: 'Tourist Attraction', rating: 4.4, address: 'La Rambla 91, Barcelona' },
    { name: 'Picasso Museum', type: 'Museum', rating: 4.5, address: 'Carrer de Montcada 15-23, Barcelona' },
  ],
  lisbon: [
    { name: 'Belem Tower', type: 'Tourist Attraction', rating: 4.5, address: 'Av. Brasilia, Lisbon' },
    { name: 'Jeronimos Monastery', type: 'Tourist Attraction', rating: 4.7, address: 'Praca do Imperio, Lisbon' },
    { name: 'Oceanarium', type: 'Aquarium', rating: 4.7, address: 'Esplanada Dom Carlos I, Lisbon' },
    { name: 'National Tile Museum', type: 'Museum', rating: 4.6, address: 'R. Me. Deus 4, Lisbon' },
    { name: 'Sao Jorge Castle', type: 'Tourist Attraction', rating: 4.5, address: 'R. de Santa Cruz do Castelo, Lisbon' },
  ],
  paris: [
    { name: 'Louvre Museum', type: 'Museum', rating: 4.7, address: 'Rue de Rivoli, Paris' },
    { name: 'Eiffel Tower', type: 'Tourist Attraction', rating: 4.7, address: 'Champ de Mars, Paris' },
    { name: 'Musee d\'Orsay', type: 'Museum', rating: 4.7, address: '1 Rue de la Legion d\'Honneur, Paris' },
    { name: 'Sacre-Coeur Basilica', type: 'Tourist Attraction', rating: 4.7, address: '35 Rue du Chevalier de la Barre, Paris' },
    { name: 'Centre Pompidou', type: 'Museum', rating: 4.5, address: 'Place Georges-Pompidou, Paris' },
  ],
  sevilla: [
    { name: 'Real Alcazar', type: 'Tourist Attraction', rating: 4.8, address: 'Patio de Banderas, Sevilla' },
    { name: 'Seville Cathedral & Giralda', type: 'Tourist Attraction', rating: 4.7, address: 'Av. de la Constitucion, Sevilla' },
    { name: 'Plaza de Espana', type: 'Tourist Attraction', rating: 4.8, address: 'Av. de Isabel la Catolica, Sevilla' },
    { name: 'Museo de Bellas Artes', type: 'Museum', rating: 4.5, address: 'Plaza del Museo 9, Sevilla' },
    { name: 'Metropol Parasol (Las Setas)', type: 'Tourist Attraction', rating: 4.4, address: 'Plaza de la Encarnacion, Sevilla' },
  ],
}

export const activitiesHandler: SkillHandler = async (message) => {
  const city = extractCity(message)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (apiKey) {
    try {
      const coords = getCityCoords(city)

      const body = {
        includedTypes: ['museum', 'tourist_attraction', 'amusement_park'],
        maxResultCount: 6,
        locationRestriction: {
          circle: {
            center: { latitude: coords.lat, longitude: coords.lng },
            radius: 5000.0,
          },
        },
      }

      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.rating,places.formattedAddress,places.primaryTypeDisplayName',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error(`Google Places returned ${response.status}`)

      const data = await response.json() as {
        places?: Array<{
          displayName?: { text: string }
          rating?: number
          formattedAddress?: string
          primaryTypeDisplayName?: { text: string }
        }>
      }

      if (data.places && data.places.length > 0) {
        const activities: Activity[] = data.places.map(p => ({
          name: p.displayName?.text || 'Unknown',
          type: p.primaryTypeDisplayName?.text || 'Attraction',
          rating: p.rating || 0,
          address: p.formattedAddress || '',
        }))

        const displayCity = city.charAt(0).toUpperCase() + city.slice(1)
        const summary = activities
          .map(a => `  ${a.name} (${a.type}, ${a.rating}/5) - ${a.address}`)
          .join('\n')

        return {
          text: `Activities & attractions in ${displayCity}:\n${summary}`,
          data: { city: displayCity, activities },
        }
      }
    } catch (err) {
      console.warn(`Google Places API error, falling back to mock data: ${err}`)
    }
  }

  // Mock fallback
  const activities = MOCK_ACTIVITIES[city] || MOCK_ACTIVITIES['madrid']!
  const displayCity = city.charAt(0).toUpperCase() + city.slice(1)

  const summary = activities
    .map(a => `  ${a.name} (${a.type}, ${a.rating}/5) - ${a.address}`)
    .join('\n')

  return {
    text: `Activities & attractions in ${displayCity}:\n${summary}`,
    data: { city: displayCity, activities },
  }
}
