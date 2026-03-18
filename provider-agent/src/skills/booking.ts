interface Booking {
  confirmationId: string
  type: 'flight' | 'hotel'
  itemId: string
  details: string
  bookedAt: string
}

const bookings = new Map<string, Booking>()
let counter = 10000

function generateConfirmationId(): string {
  counter++
  return `CONF-${counter}`
}

export async function handleBooking(query: string): Promise<string> {
  const lower = query.toLowerCase()

  if (lower.includes('cancel')) {
    return cancelBooking(query)
  }

  if (lower.includes('list') || lower.includes('my booking') || lower.includes('my reservation')) {
    return listBookings()
  }

  return createBooking(query)
}

function createBooking(query: string): string {
  const isHotel = /hotel/i.test(query)
  const type = isHotel ? 'hotel' : 'flight'

  const idMatch = query.match(/((?:IB|VY|FR|BA|AF|XX)\d+|HTL-\w+-\d+)/i)
  const itemId = idMatch ? idMatch[1].toUpperCase() : `${type.toUpperCase()}-AUTO`

  const confirmationId = generateConfirmationId()
  const booking: Booking = {
    confirmationId,
    type,
    itemId,
    details: query,
    bookedAt: new Date().toISOString(),
  }

  bookings.set(confirmationId, booking)

  return `Booking confirmed!\n  Confirmation ID: ${confirmationId}\n  Type: ${type}\n  Item: ${itemId}\n  Status: CONFIRMED`
}

function cancelBooking(query: string): string {
  const confMatch = query.match(/CONF-\d+/i)
  if (!confMatch) {
    if (bookings.size === 0) return 'No active bookings to cancel.'
    const last = Array.from(bookings.keys()).pop()!
    const booking = bookings.get(last)!
    bookings.delete(last)
    return `Booking ${last} (${booking.type}: ${booking.itemId}) has been cancelled.`
  }

  const confId = confMatch[0].toUpperCase()
  const booking = bookings.get(confId)
  if (!booking) return `Booking ${confId} not found. It may have already been cancelled.`

  bookings.delete(confId)
  return `Booking ${confId} (${booking.type}: ${booking.itemId}) has been cancelled successfully.`
}

function listBookings(): string {
  if (bookings.size === 0) return 'No active bookings.'

  let result = `Active bookings (${bookings.size}):\n\n`
  for (const [id, b] of bookings) {
    result += `  ${id} | ${b.type} | ${b.itemId} | Booked: ${b.bookedAt}\n`
  }
  return result
}
