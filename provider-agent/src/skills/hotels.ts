import type { SkillHandler } from './types.js'
import { extractCity } from './cities.js'

interface Hotel {
  name: string
  neighborhood: string
  stars: number
  price_per_night: number
  currency: string
  amenities: string[]
}

const HOTEL_DATA: Record<string, Hotel[]> = {
  madrid: [
    { name: 'Hotel Puerta del Sol', neighborhood: 'Sol', stars: 4, price_per_night: 120, currency: 'EUR', amenities: ['wifi', 'breakfast', 'gym', 'rooftop bar'] },
    { name: 'Hostal Madrid Centro', neighborhood: 'Gran Via', stars: 2, price_per_night: 55, currency: 'EUR', amenities: ['wifi', 'air conditioning'] },
    { name: 'NH Collection Palacio de Tepa', neighborhood: 'La Latina', stars: 5, price_per_night: 210, currency: 'EUR', amenities: ['wifi', 'spa', 'restaurant', 'gym', 'concierge'] },
    { name: 'Room Mate Oscar', neighborhood: 'Chueca', stars: 3, price_per_night: 85, currency: 'EUR', amenities: ['wifi', 'rooftop pool', 'bar'] },
    { name: 'Petit Palace Savoy Alfonso XII', neighborhood: 'Retiro', stars: 4, price_per_night: 145, currency: 'EUR', amenities: ['wifi', 'breakfast', 'bikes', 'gym'] },
    { name: 'Generator Madrid', neighborhood: 'Malasana', stars: 2, price_per_night: 35, currency: 'EUR', amenities: ['wifi', 'bar', 'lounge', 'laundry'] },
  ],
  barcelona: [
    { name: 'Hotel Gotic', neighborhood: 'Gothic Quarter', stars: 3, price_per_night: 95, currency: 'EUR', amenities: ['wifi', 'breakfast', 'terrace'] },
    { name: 'W Barcelona', neighborhood: 'Barceloneta', stars: 5, price_per_night: 280, currency: 'EUR', amenities: ['wifi', 'spa', 'pool', 'beach access', 'restaurant'] },
    { name: 'Casa Camper', neighborhood: 'El Raval', stars: 4, price_per_night: 160, currency: 'EUR', amenities: ['wifi', 'breakfast', 'gym', 'hammock lounge'] },
    { name: 'Hostal Grau', neighborhood: 'El Raval', stars: 2, price_per_night: 60, currency: 'EUR', amenities: ['wifi', 'air conditioning'] },
    { name: 'Hotel Arts Barcelona', neighborhood: 'Port Olimpic', stars: 5, price_per_night: 320, currency: 'EUR', amenities: ['wifi', 'spa', 'pool', 'restaurant', 'concierge'] },
    { name: 'TOC Hostel Barcelona', neighborhood: 'Eixample', stars: 2, price_per_night: 28, currency: 'EUR', amenities: ['wifi', 'bar', 'rooftop', 'kitchen'] },
  ],
  lisbon: [
    { name: 'Hotel Avenida Palace', neighborhood: 'Baixa', stars: 5, price_per_night: 195, currency: 'EUR', amenities: ['wifi', 'restaurant', 'bar', 'concierge'] },
    { name: 'Lisboa Carmo Hotel', neighborhood: 'Chiado', stars: 4, price_per_night: 130, currency: 'EUR', amenities: ['wifi', 'breakfast', 'terrace'] },
    { name: 'Pensao Residencial Portuense', neighborhood: 'Alfama', stars: 2, price_per_night: 45, currency: 'EUR', amenities: ['wifi', 'breakfast'] },
    { name: 'Santiago de Alfama', neighborhood: 'Alfama', stars: 5, price_per_night: 250, currency: 'EUR', amenities: ['wifi', 'spa', 'pool', 'restaurant', 'terrace'] },
    { name: 'Browns Central Hotel', neighborhood: 'Baixa', stars: 4, price_per_night: 140, currency: 'EUR', amenities: ['wifi', 'gym', 'bar', 'rooftop'] },
  ],
  paris: [
    { name: 'Hotel Le Marais', neighborhood: 'Le Marais', stars: 3, price_per_night: 130, currency: 'EUR', amenities: ['wifi', 'breakfast', 'concierge'] },
    { name: 'Hotel Plaza Athenee', neighborhood: 'Champs-Elysees', stars: 5, price_per_night: 450, currency: 'EUR', amenities: ['wifi', 'spa', 'restaurant', 'gym', 'concierge'] },
    { name: 'Generator Paris', neighborhood: 'Belleville', stars: 2, price_per_night: 40, currency: 'EUR', amenities: ['wifi', 'bar', 'lounge'] },
    { name: 'Hotel des Arts Montmartre', neighborhood: 'Montmartre', stars: 3, price_per_night: 110, currency: 'EUR', amenities: ['wifi', 'breakfast'] },
    { name: 'Le Pavillon de la Reine', neighborhood: 'Le Marais', stars: 4, price_per_night: 280, currency: 'EUR', amenities: ['wifi', 'spa', 'garden', 'restaurant'] },
  ],
  sevilla: [
    { name: 'Hotel Alfonso XIII', neighborhood: 'Santa Cruz', stars: 5, price_per_night: 280, currency: 'EUR', amenities: ['wifi', 'pool', 'spa', 'restaurant', 'garden'] },
    { name: 'Hotel Casa 1800', neighborhood: 'Santa Cruz', stars: 4, price_per_night: 145, currency: 'EUR', amenities: ['wifi', 'breakfast', 'rooftop', 'terrace'] },
    { name: 'Pensao Sevilla Centro', neighborhood: 'Triana', stars: 2, price_per_night: 50, currency: 'EUR', amenities: ['wifi', 'air conditioning'] },
    { name: 'Hotel Mercer Sevilla', neighborhood: 'Arenal', stars: 5, price_per_night: 220, currency: 'EUR', amenities: ['wifi', 'pool', 'restaurant', 'bar', 'concierge'] },
    { name: 'Un Patio al Sur', neighborhood: 'Santa Cruz', stars: 3, price_per_night: 85, currency: 'EUR', amenities: ['wifi', 'patio', 'breakfast'] },
  ],
  valencia: [
    { name: 'Hotel Vincci Lys', neighborhood: 'Ciutat Vella', stars: 4, price_per_night: 110, currency: 'EUR', amenities: ['wifi', 'breakfast', 'gym'] },
    { name: 'Hospes Palau de la Mar', neighborhood: 'Eixample', stars: 5, price_per_night: 195, currency: 'EUR', amenities: ['wifi', 'spa', 'pool', 'restaurant'] },
    { name: 'Hotel Sorolla Centro', neighborhood: 'Eixample', stars: 3, price_per_night: 75, currency: 'EUR', amenities: ['wifi', 'breakfast'] },
    { name: 'Red Nest Hostel', neighborhood: 'El Carmen', stars: 2, price_per_night: 22, currency: 'EUR', amenities: ['wifi', 'bar', 'terrace'] },
  ],
}

function extractHotelName(message: string): string | null {
  // Try to match "book Hotel X" or "book X hotel"
  const match = message.match(/book\s+(?:hotel\s+)?(.+?)(?:\s+in\s+|\s+for\s+|\s+from\s+|$)/i)
  if (match) {
    return match[1].trim()
  }
  return null
}

function extractDates(message: string): { check_in: string; check_out: string } {
  const today = new Date()

  // Look for date ranges like "March 20-22" or "20-22 March"
  const rangeMatch = message.match(/(\w+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2})/)
  if (rangeMatch) {
    const year = today.getFullYear()
    const monthStr = rangeMatch[1].toLowerCase()
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    }
    const month = months[monthStr]
    if (month !== undefined) {
      const checkIn = new Date(year, month, parseInt(rangeMatch[2]))
      const checkOut = new Date(year, month, parseInt(rangeMatch[3]))
      return {
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
      }
    }
  }

  // Default: tomorrow to day after
  const checkIn = new Date(today)
  checkIn.setDate(checkIn.getDate() + 1)
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + 2)

  return {
    check_in: checkIn.toISOString().split('T')[0],
    check_out: checkOut.toISOString().split('T')[0],
  }
}

export const hotelsHandler: SkillHandler = async (message) => {
  const lower = message.toLowerCase()
  const city = extractCity(message)

  // Handle cancellation
  if (lower.includes('cancel')) {
    const confMatch = message.match(/HTL-[\w-]+/i)
    const confirmation = confMatch ? confMatch[0].toUpperCase() : 'UNKNOWN'

    return {
      text: `Hotel reservation ${confirmation} has been cancelled successfully. A refund will be processed within 3-5 business days.`,
      data: {
        action: 'cancelled',
        confirmation,
      },
    }
  }

  // Handle booking
  if (lower.includes('book hotel') || lower.includes('book a hotel') || (lower.includes('book') && lower.includes('hotel'))) {
    const hotelName = extractHotelName(message)
    const dates = extractDates(message)
    const cityHotels = HOTEL_DATA[city] || HOTEL_DATA['madrid']!

    // Find matching hotel
    let hotel = cityHotels[0]
    if (hotelName) {
      const found = cityHotels.find(h => h.name.toLowerCase().includes(hotelName.toLowerCase()))
      if (found) hotel = found
    }

    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase()
    const dateStr = dates.check_in.replace(/-/g, '')
    const confirmation = `HTL-${dateStr}-${randomId}`

    const nights = Math.ceil(
      (new Date(dates.check_out).getTime() - new Date(dates.check_in).getTime()) / (1000 * 60 * 60 * 24)
    )
    const totalPrice = hotel.price_per_night * nights

    return {
      text: `Hotel booked successfully!\nConfirmation: ${confirmation}\nHotel: ${hotel.name} (${hotel.stars} stars)\nCheck-in: ${dates.check_in}\nCheck-out: ${dates.check_out}\nNights: ${nights}\nTotal: ${totalPrice} ${hotel.currency}`,
      data: {
        action: 'booked',
        confirmation,
        hotel: hotel.name,
        neighborhood: hotel.neighborhood,
        stars: hotel.stars,
        check_in: dates.check_in,
        check_out: dates.check_out,
        nights,
        price_per_night: hotel.price_per_night,
        total_price: totalPrice,
        currency: hotel.currency,
      },
    }
  }

  // Handle search
  const hotels = HOTEL_DATA[city] || HOTEL_DATA['madrid']!
  const displayCity = city.charAt(0).toUpperCase() + city.slice(1)

  const summary = hotels
    .map(h => `  ${h.name} (${'*'.repeat(h.stars)}) - ${h.neighborhood} - ${h.price_per_night} ${h.currency}/night [${h.amenities.join(', ')}]`)
    .join('\n')

  return {
    text: `Hotels in ${displayCity}:\n${summary}`,
    data: { city: displayCity, hotels },
  }
}
