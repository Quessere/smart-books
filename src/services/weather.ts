// Open-Meteo uses WMO weather interpretation codes.
export function describeWeather(code: number): string {
  if (code === 0) return '晴'
  if (code === 1 || code === 2) return '多云'
  if (code === 3) return '阴'
  if (code === 45 || code === 48) return '雾'
  if ([51, 53, 55, 56, 57].includes(code)) return '毛毛雨'
  if ([61, 63, 65, 66, 67].includes(code)) return '雨'
  if ([71, 73, 75, 77].includes(code)) return '雪'
  if ([80, 81, 82].includes(code)) return '阵雨'
  if (code === 85 || code === 86) return '阵雪'
  if ([95, 96, 99].includes(code)) return '雷雨'
  return '天气未知'
}

export async function getCurrentWeather(latitude: number, longitude: number) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,weather_code', timezone: 'auto' })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Weather request failed')
  const data: unknown = await response.json()
  const current = (data as { current?: { temperature_2m?: unknown; weather_code?: unknown } } | null)?.current
  if (typeof current?.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m) || typeof current.weather_code !== 'number' || !Number.isFinite(current.weather_code)) throw new Error('Invalid weather data')
  return { temperature: Math.round(current.temperature_2m), description: describeWeather(current.weather_code) }
}
