/**
 * Shared city extraction and coordinates for all skills.
 */

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  paris: { lat: 48.8566, lng: 2.3522 },
  sevilla: { lat: 37.3891, lng: -5.9845 },
  london: { lat: 51.5074, lng: -0.1278 },
  rome: { lat: 41.9028, lng: 12.4964 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  malaga: { lat: 36.7213, lng: -4.4213 },
  bilbao: { lat: 43.2630, lng: -2.9350 },
  porto: { lat: 41.1579, lng: -8.6291 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  berlin: { lat: 52.5200, lng: 13.4050 },
  milan: { lat: 45.4642, lng: 9.1900 },
}

const ALIASES: Record<string, string> = {
  seville: 'sevilla',
  roma: 'rome',
  lisboa: 'lisbon',
  milano: 'milan',
}

const KNOWN_CITIES = [...Object.keys(CITY_COORDS), ...Object.keys(ALIASES)]

const SKIP_WORDS = new Set([
  'weather', 'forecast', 'flights', 'flight', 'hotel', 'hotels', 'restaurant',
  'restaurants', 'activities', 'activity', 'museum', 'attractions', 'tours',
  'book', 'cancel', 'booking', 'search', 'find', 'get', 'show', 'check',
  'this', 'next', 'weekend', 'today', 'tomorrow', 'the', 'a', 'an', 'and',
  'from', 'to', 'in', 'on', 'for', 'at', 'de', 'en', 'near', 'nearby',
  'cheap', 'best', 'top', 'good', 'things', 'what', 'how', 'is', 'are',
  'spain', 'france', 'italy', 'portugal', 'germany', 'netherlands', 'uk',
])

/**
 * Extract city name from a message. Tries known cities first,
 * then falls back to the first non-common word.
 */
export function extractCity(message: string): string {
  const lower = message.toLowerCase()

  // Check known cities first
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city)) {
      return ALIASES[city] || city
    }
  }

  // Fallback: first word that isn't a common/skip word
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/)
  for (const word of words) {
    if (word.length > 2 && !SKIP_WORDS.has(word)) {
      return word
    }
  }

  return 'madrid'
}

/** Get coordinates for a city, defaulting to Madrid. */
export function getCityCoords(city: string) {
  return CITY_COORDS[city] || CITY_COORDS['madrid']!
}

/** IATA codes for flights. */
export const IATA_CODES: Record<string, string> = {
  madrid: 'MAD',
  barcelona: 'BCN',
  lisbon: 'LIS',
  paris: 'CDG',
  sevilla: 'SVQ',
  london: 'LHR',
  rome: 'FCO',
  valencia: 'VLC',
  malaga: 'AGP',
  bilbao: 'BIO',
  porto: 'OPO',
  amsterdam: 'AMS',
  berlin: 'BER',
  milan: 'MXP',
}
