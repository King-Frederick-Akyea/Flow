export const weatherService = {
  async getWeather(config: any) {
    const apiKey = process.env.OPENWEATHER_API_KEY
    const city = config.city || 'London'
    const country = config.country || ''
    const units = config.units || 'metric'

    const location = country ? `${city},${country}` : city

    if (!apiKey) {
      // Return mock data if no API key
      console.log('Using mock weather data - no API key configured')
      return {
        temperature: Math.round(Math.random() * 30 + 5),
        condition: ['Sunny', 'Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
        city: city,
        humidity: Math.round(Math.random() * 50 + 30),
        windSpeed: Math.round(Math.random() * 10 + 1),
        pressure: Math.round(Math.random() * 100 + 1000),
        source: 'mock'
      }
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${apiKey}`
      )
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        city: data.name,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
        country: data.sys.country,
        source: 'openweathermap'
      }
    } catch (error) {
      console.error('Weather API error:', error)
      // Fallback to mock data
      return {
        temperature: 22,
        condition: 'Sunny',
        city: city,
        humidity: 65,
        windSpeed: 3.5,
        pressure: 1013,
        source: 'mock_fallback'
      }
    }
  }
}