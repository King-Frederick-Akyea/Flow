export const emailService = {
  async sendEmail(config: any, data: any) {
    const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY
    const DEFAULT_FROM_EMAIL = process.env.NEXT_PUBLIC_DEFAULT_FROM_EMAIL
    const EMAIL_SENDER_NAME = process.env.NEXT_PUBLIC_EMAIL_SENDER_NAME || 'Workflow Automation'

    if (!BREVO_API_KEY) {
      throw new Error('Brevo API key is not configured. Please add NEXT_PUBLIC_BREVO_API_KEY to your environment variables.')
    }

    if (!DEFAULT_FROM_EMAIL) {
      throw new Error('Default from email is not configured. Please add NEXT_PUBLIC_DEFAULT_FROM_EMAIL to your environment variables.')
    }

    const subject = data.subject || this.generateSubject(data)
    const textContent = data.text || this.generateTextContent(data)
    const htmlContent = this.generateHTMLContent(data)

    const payload = {
      sender: { 
        name: EMAIL_SENDER_NAME, 
        email: DEFAULT_FROM_EMAIL 
      },
      to: [{ email: config.to }],
      subject,
      textContent,
      htmlContent,
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Brevo API error: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()
      return { 
        sent: true, 
        messageId: result.messageId,
        recipient: config.to
      }
    } catch (error: any) {
      console.error('Email service error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
  },

  generateSubject(data: any): string {
    if (data.temperature !== undefined) {
      return `🌤️ Weather Update: ${data.city || 'Your Location'} - ${data.temperature}°C`
    }
    return 'Workflow Automation Update'
  },

  generateTextContent(data: any): string {
    if (data.temperature !== undefined) {
      return `
Good ${this.getTimeOfDay()}!

Here's your weather update for ${data.city || 'your location'}:

🌡️ Temperature: ${data.temperature}°C
☁️ Condition: ${data.condition}
💧 Humidity: ${data.humidity}%
💨 Wind Speed: ${data.windSpeed} m/s
📊 Pressure: ${data.pressure} hPa

Have a wonderful day! 🌟

---
Sent via Workflow Automation
      `.trim()
    }
    
    return 'Your workflow has been executed successfully.'
  },

  generateHTMLContent(data: any): string {
    if (data.temperature !== undefined) {
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; background: #f8f9fa; }
    .weather-card { background: white; border-radius: 10px; padding: 20px; margin: 10px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌤️ Weather Update</h1>
    <p>Good ${this.getTimeOfDay()}! Here's your daily weather report</p>
  </div>
  
  <div class="content">
    <div class="weather-card">
      <h2>${data.city || 'Your Location'}</h2>
      <div class="metric">
        <span>🌡️ Temperature:</span>
        <strong>${data.temperature}°C</strong>
      </div>
      <div class="metric">
        <span>☁️ Condition:</span>
        <strong>${data.condition}</strong>
      </div>
      <div class="metric">
        <span>💧 Humidity:</span>
        <strong>${data.humidity}%</strong>
      </div>
      <div class="metric">
        <span>💨 Wind Speed:</span>
        <strong>${data.windSpeed} m/s</strong>
      </div>
      <div class="metric">
        <span>📊 Pressure:</span>
        <strong>${data.pressure} hPa</strong>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>Sent via Workflow Automation • ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
      `.trim()
    }
    
    return '<p>Your workflow has been executed successfully.</p>'
  },

  getTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }
}