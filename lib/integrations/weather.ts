export const weatherService = {
  async execute(config: any): Promise<any> {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    const city = config.city || 'London';
    const country = config.country || '';
    const units = config.units || 'metric';

    if (!apiKey) {
      throw new Error('OpenWeather API key is not configured. Please add NEXT_PUBLIC_OPENWEATHER_API_KEY to your environment variables.');
    }

    const location = country ? `${city},${country}` : city;

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`City "${location}" not found. Please check the city name and country code.`);
        } else if (response.status === 401) {
          throw new Error('Invalid OpenWeather API key. Please check your configuration.');
        } else {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          description: data.weather[0].description,
          city: data.name,
          country: data.sys.country,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          pressure: data.main.pressure,
          feelsLike: Math.round(data.main.feels_like),
          visibility: data.visibility / 1000, // Convert to km
          sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
          sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
          source: 'openweathermap',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Weather API error:', error);
      return {
        success: false,
        error: `Failed to fetch weather data: ${error.message}`
      };
    }
  }
};