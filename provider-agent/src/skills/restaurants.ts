import type { SkillHandler } from './types.js'
import { extractCity, getCityCoords } from './cities.js'

interface Restaurant {
  name: string
  rating: number
  price_level: string
  address: string
  cuisine_type: string
  url?: string
}

const MOCK_RESTAURANTS: Record<string, Restaurant[]> = {
  madrid: [
    { name: 'Sobrino de Botin', rating: 4.5, price_level: 'PRICE_LEVEL_MODERATE', address: 'Calle de Cuchilleros 17, Madrid', cuisine_type: 'Traditional Spanish' },
    { name: 'Mercado de San Miguel', rating: 4.3, price_level: 'PRICE_LEVEL_MODERATE', address: 'Plaza de San Miguel, Madrid', cuisine_type: 'Market / Tapas' },
    { name: 'La Barraca', rating: 4.4, price_level: 'PRICE_LEVEL_MODERATE', address: 'Calle de la Reina 29, Madrid', cuisine_type: 'Paella & Rice' },
    { name: 'StreetXO', rating: 4.2, price_level: 'PRICE_LEVEL_EXPENSIVE', address: 'Calle de Serrano 52, Madrid', cuisine_type: 'Asian Fusion' },
    { name: 'Casa Labra', rating: 4.6, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: 'Calle de Tetuan 12, Madrid', cuisine_type: 'Traditional Tapas' },
  ],
  barcelona: [
    { name: 'Can Culleretes', rating: 4.3, price_level: 'PRICE_LEVEL_MODERATE', address: 'Carrer Quintana 5, Gothic Quarter', cuisine_type: 'Catalan' },
    { name: 'Bar Celta Pulperia', rating: 4.5, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: 'Carrer de la Merce 16, Gothic Quarter', cuisine_type: 'Galician Seafood' },
    { name: 'Tickets Bar', rating: 4.7, price_level: 'PRICE_LEVEL_EXPENSIVE', address: 'Avinguda del Parallel 164, Barcelona', cuisine_type: 'Creative Tapas' },
    { name: 'La Boqueria Market Stalls', rating: 4.4, price_level: 'PRICE_LEVEL_MODERATE', address: 'La Rambla 91, Barcelona', cuisine_type: 'Market / Seafood' },
    { name: 'El Xampanyet', rating: 4.3, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: 'Carrer de Montcada 22, El Born', cuisine_type: 'Tapas & Cava' },
  ],
  lisbon: [
    { name: 'Time Out Market', rating: 4.3, price_level: 'PRICE_LEVEL_MODERATE', address: 'Av. 24 de Julho 49, Lisbon', cuisine_type: 'Food Hall' },
    { name: 'Cervejaria Ramiro', rating: 4.6, price_level: 'PRICE_LEVEL_MODERATE', address: 'Av. Almirante Reis 1H, Lisbon', cuisine_type: 'Seafood' },
    { name: 'Pasteis de Belem', rating: 4.5, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: 'R. de Belem 84-92, Lisbon', cuisine_type: 'Pastry / Cafe' },
    { name: 'Taberna da Rua das Flores', rating: 4.7, price_level: 'PRICE_LEVEL_MODERATE', address: 'Rua das Flores 103, Lisbon', cuisine_type: 'Portuguese' },
    { name: 'A Cevicheria', rating: 4.4, price_level: 'PRICE_LEVEL_EXPENSIVE', address: 'R. Dom Pedro V 129, Lisbon', cuisine_type: 'Peruvian Fusion' },
  ],
  paris: [
    { name: 'Le Comptoir du Pantheon', rating: 4.3, price_level: 'PRICE_LEVEL_MODERATE', address: '5 Rue Soufflot, Paris', cuisine_type: 'French Bistro' },
    { name: 'Breizh Cafe', rating: 4.5, price_level: 'PRICE_LEVEL_MODERATE', address: '109 Rue Vieille du Temple, Paris', cuisine_type: 'Creperie' },
    { name: 'Le Bouillon Chartier', rating: 4.2, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: '7 Rue du Faubourg Montmartre, Paris', cuisine_type: 'Traditional French' },
    { name: 'Pink Mamma', rating: 4.4, price_level: 'PRICE_LEVEL_MODERATE', address: '20 Rue de Douai, Paris', cuisine_type: 'Italian' },
    { name: 'Chez Janou', rating: 4.5, price_level: 'PRICE_LEVEL_MODERATE', address: '2 Rue Roger Verlomme, Paris', cuisine_type: 'Provencal' },
  ],
  sevilla: [
    { name: 'El Rinconcillo', rating: 4.4, price_level: 'PRICE_LEVEL_MODERATE', address: 'Calle Gerona 40, Sevilla', cuisine_type: 'Traditional Andalusian' },
    { name: 'Bodega Santa Cruz', rating: 4.3, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: 'Calle Rodrigo Caro 1, Sevilla', cuisine_type: 'Tapas' },
    { name: 'Abantal', rating: 4.7, price_level: 'PRICE_LEVEL_VERY_EXPENSIVE', address: 'Calle Alcalde Jose de la Bandera 7, Sevilla', cuisine_type: 'Modern Andalusian' },
    { name: 'La Brunilda', rating: 4.6, price_level: 'PRICE_LEVEL_MODERATE', address: 'Calle Galera 5, Sevilla', cuisine_type: 'Creative Tapas' },
    { name: 'Bar Las Teresas', rating: 4.2, price_level: 'PRICE_LEVEL_INEXPENSIVE', address: 'Calle Santa Teresa 2, Sevilla', cuisine_type: 'Traditional Tapas' },
  ],
}

function formatPriceLevel(level: string): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  }
  return map[level] || '$$'
}

export const restaurantsHandler: SkillHandler = async (message) => {
  const city = extractCity(message)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (apiKey) {
    try {
      const coords = getCityCoords(city)

      const body = {
        includedTypes: ['restaurant'],
        maxResultCount: 5,
        locationRestriction: {
          circle: {
            center: { latitude: coords.lat, longitude: coords.lng },
            radius: 1000.0,
          },
        },
      }

      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.rating,places.priceLevel,places.formattedAddress,places.primaryTypeDisplayName,places.googleMapsUri',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error(`Google Places returned ${response.status}`)

      const data = await response.json() as {
        places?: Array<{
          displayName?: { text: string }
          rating?: number
          priceLevel?: string
          formattedAddress?: string
          primaryTypeDisplayName?: { text: string }
          googleMapsUri?: string
        }>
      }

      if (data.places && data.places.length > 0) {
        const restaurants: Restaurant[] = data.places.map(p => ({
          name: p.displayName?.text || 'Unknown',
          rating: p.rating || 0,
          price_level: p.priceLevel || 'PRICE_LEVEL_MODERATE',
          address: p.formattedAddress || '',
          cuisine_type: p.primaryTypeDisplayName?.text || 'Restaurant',
          url: p.googleMapsUri || '',
        }))

        const displayCity = city.charAt(0).toUpperCase() + city.slice(1)
        const summary = restaurants
          .map(r => {
          const link = r.url ? ` | Link: ${r.url}` : ''
          return `  ${r.name} (${r.rating}/5, ${formatPriceLevel(r.price_level)}) - ${r.cuisine_type} - ${r.address}${link}`
        })
          .join('\n')

        return {
          text: `Restaurants in ${displayCity}:\n${summary}`,
          data: { city: displayCity, restaurants },
        }
      }
    } catch (err) {
      console.warn(`Google Places API error, falling back to mock data: ${err}`)
    }
  }

  // Mock fallback
  const restaurants = MOCK_RESTAURANTS[city] || MOCK_RESTAURANTS['madrid']!
  const displayCity = city.charAt(0).toUpperCase() + city.slice(1)

  const summary = restaurants
    .map(r => {
          const link = r.url ? ` | Link: ${r.url}` : ''
          return `  ${r.name} (${r.rating}/5, ${formatPriceLevel(r.price_level)}) - ${r.cuisine_type} - ${r.address}${link}`
        })
    .join('\n')

  return {
    text: `Restaurants in ${displayCity}:\n${summary}`,
    data: { city: displayCity, restaurants },
  }
}
