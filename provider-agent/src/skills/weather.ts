import type { SkillHandler } from './types.js'
import { extractCity } from './cities.js'

interface ForecastEntry {
  date: string
  temp_min: number
  temp_max: number
  condition: string
  humidity: number
  wind_speed: number
}

const MOCK_DATA: Record<string, ForecastEntry[]> = {
  madrid: [
    { date: '2026-03-18', temp_min: 10, temp_max: 19, condition: 'Partly cloudy', humidity: 45, wind_speed: 12 },
    { date: '2026-03-19', temp_min: 11, temp_max: 21, condition: 'Sunny', humidity: 38, wind_speed: 8 },
    { date: '2026-03-20', temp_min: 9, temp_max: 18, condition: 'Light rain', humidity: 65, wind_speed: 15 },
  ],
  barcelona: [
    { date: '2026-03-18', temp_min: 12, temp_max: 18, condition: 'Partly cloudy', humidity: 55, wind_speed: 14 },
    { date: '2026-03-19', temp_min: 13, temp_max: 20, condition: 'Sunny', humidity: 48, wind_speed: 10 },
    { date: '2026-03-20', temp_min: 11, temp_max: 17, condition: 'Overcast', humidity: 62, wind_speed: 18 },
  ],
  lisbon: [
    { date: '2026-03-18', temp_min: 13, temp_max: 20, condition: 'Sunny', humidity: 50, wind_speed: 16 },
    { date: '2026-03-19', temp_min: 14, temp_max: 22, condition: 'Clear', humidity: 42, wind_speed: 12 },
    { date: '2026-03-20', temp_min: 12, temp_max: 19, condition: 'Partly cloudy', humidity: 55, wind_speed: 14 },
  ],
  paris: [
    { date: '2026-03-18', temp_min: 6, temp_max: 13, condition: 'Overcast', humidity: 70, wind_speed: 18 },
    { date: '2026-03-19', temp_min: 7, temp_max: 14, condition: 'Light rain', humidity: 75, wind_speed: 20 },
    { date: '2026-03-20', temp_min: 5, temp_max: 12, condition: 'Cloudy', humidity: 68, wind_speed: 16 },
  ],
  sevilla: [
    { date: '2026-03-18', temp_min: 12, temp_max: 23, condition: 'Sunny', humidity: 35, wind_speed: 10 },
    { date: '2026-03-19', temp_min: 13, temp_max: 25, condition: 'Clear', humidity: 30, wind_speed: 8 },
    { date: '2026-03-20', temp_min: 11, temp_max: 22, condition: 'Partly cloudy', humidity: 40, wind_speed: 12 },
  ],
  london: [
    { date: '2026-03-18', temp_min: 5, temp_max: 11, condition: 'Rainy', humidity: 80, wind_speed: 22 },
    { date: '2026-03-19', temp_min: 6, temp_max: 12, condition: 'Overcast', humidity: 75, wind_speed: 18 },
    { date: '2026-03-20', temp_min: 4, temp_max: 10, condition: 'Partly cloudy', humidity: 70, wind_speed: 16 },
  ],
  rome: [
    { date: '2026-03-18', temp_min: 10, temp_max: 18, condition: 'Sunny', humidity: 50, wind_speed: 10 },
    { date: '2026-03-19', temp_min: 11, temp_max: 19, condition: 'Partly cloudy', humidity: 48, wind_speed: 12 },
    { date: '2026-03-20', temp_min: 9, temp_max: 17, condition: 'Light rain', humidity: 60, wind_speed: 14 },
  ],
  valencia: [
    { date: '2026-03-18', temp_min: 12, temp_max: 20, condition: 'Sunny', humidity: 50, wind_speed: 12 },
    { date: '2026-03-19', temp_min: 13, temp_max: 22, condition: 'Clear', humidity: 45, wind_speed: 10 },
    { date: '2026-03-20', temp_min: 11, temp_max: 19, condition: 'Partly cloudy', humidity: 55, wind_speed: 14 },
  ],
}

export const weatherHandler: SkillHandler = async (message) => {
  const city = extractCity(message)
  const apiKey = process.env.OPENWEATHER_API_KEY

  let forecasts: ForecastEntry[]

  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&cnt=8&appid=${apiKey}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`OpenWeather API returned ${response.status}`)
      }

      const data = await response.json() as {
        city: { name: string }
        list: Array<{
          dt_txt: string
          main: { temp_min: number; temp_max: number; humidity: number }
          weather: Array<{ description: string }>
          wind: { speed: number }
        }>
      }

      forecasts = data.list.map(entry => ({
        date: entry.dt_txt,
        temp_min: Math.round(entry.main.temp_min),
        temp_max: Math.round(entry.main.temp_max),
        condition: entry.weather[0].description,
        humidity: entry.main.humidity,
        wind_speed: Math.round(entry.wind.speed * 3.6), // m/s to km/h
      }))

      const cityName = data.city.name
      const summary = forecasts
        .map(f => `${f.date}: ${f.temp_min}-${f.temp_max}C, ${f.condition}`)
        .join('\n')

      return {
        text: `Weather forecast for ${cityName}:\n${summary}`,
        data: { city: cityName, forecasts },
      }
    } catch (err) {
      console.warn(`OpenWeather API error, falling back to mock data: ${err}`)
    }
  }

  // Mock fallback
  const cityKey = city.toLowerCase()
  forecasts = MOCK_DATA[cityKey] || MOCK_DATA['madrid']!
  const displayCity = city.charAt(0).toUpperCase() + city.slice(1)

  const summary = forecasts
    .map(f => `  ${f.date}: ${f.temp_min}-${f.temp_max}C, ${f.condition}, humidity ${f.humidity}%, wind ${f.wind_speed} km/h`)
    .join('\n')

  return {
    text: `Weather forecast for ${displayCity}:\n${summary}`,
    data: { city: displayCity, forecasts },
  }
}
