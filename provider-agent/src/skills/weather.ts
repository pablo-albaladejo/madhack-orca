import { geocode } from './geocoding.js'

interface CurrentWeather {
  temperature: number
  windspeed: number
  weathercode: number
}

interface DailyForecast {
  time: string[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_sum: number[]
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
}

export async function getWeather(query: string): Promise<string> {
  const city = extractCity(query)
  if (!city) return 'Could not determine the city. Please specify a city name.'

  const geo = await geocode(city)
  if (!geo) return `Could not find coordinates for "${city}".`

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`
  const res = await fetch(url)
  const data = await res.json() as {
    current_weather: CurrentWeather
    daily: DailyForecast
  }

  const current = data.current_weather
  const condition = WEATHER_CODES[current.weathercode] ?? 'Unknown'
  const daily = data.daily

  let result = `Weather in ${city}:\n`
  result += `Current: ${current.temperature}°C, ${condition}, wind ${current.windspeed} km/h\n\n`
  result += `5-day forecast:\n`

  for (let i = 0; i < daily.time.length; i++) {
    result += `  ${daily.time[i]}: ${daily.temperature_2m_min[i]}°C – ${daily.temperature_2m_max[i]}°C`
    if (daily.precipitation_sum[i] > 0) {
      result += `, rain ${daily.precipitation_sum[i]}mm`
    }
    result += '\n'
  }

  return result
}

function extractCity(query: string): string | null {
  const lower = query.toLowerCase()
  const patterns = [
    /weather (?:in|for|at) (.+?)(?:\?|$|\.|,)/i,
    /temperature (?:in|for|at) (.+?)(?:\?|$|\.|,)/i,
    /forecast (?:in|for|at) (.+?)(?:\?|$|\.|,)/i,
    /(?:in|for|at) (.+?)(?:\?|$|\.|,)/i,
  ]
  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match) return match[1].trim()
  }
  const words = lower.replace(/[?.,!]/g, '').split(/\s+/)
  const skip = new Set(['weather', 'temperature', 'forecast', 'what', 'the', 'is', 'how', 'get', 'check', 'whats', "what's"])
  const remaining = words.filter(w => !skip.has(w))
  return remaining.length ? remaining.join(' ') : null
}
