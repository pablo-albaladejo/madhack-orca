export interface GeoLocation {
  lat: number
  lon: number
  displayName: string
}

export async function geocode(city: string): Promise<GeoLocation | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TravelProviderAgent/1.0' },
  })
  const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
  if (!data.length) return null
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  }
}
