export const emailService = {
  async sendEmail(config: any, data: any) {
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL
    const EMAIL_SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'Automation'

    if (!BREVO_API_KEY || !DEFAULT_FROM_EMAIL) {
      throw new Error('Brevo not configured on server')
    }

    const subject = this.replacePlaceholders(config.subject, data)
    const textContent = this.replacePlaceholders(config.text, data)
    const htmlContent = this.replacePlaceholders(config.html, data)

    const payload = {
      sender: { 
        name: config.senderName || EMAIL_SENDER_NAME, 
        email: config.from || DEFAULT_FROM_EMAIL 
      },
      to: [{ email: config.to }],
      subject,
      htmlContent,
      textContent,
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetail
      try {
        errorDetail = JSON.parse(errorText)
      } catch {
        errorDetail = errorText
      }
      
      throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorDetail)}`)
    }

    const result = await response.json()
    return { sent: true, messageId: result.messageId }
  },

  replacePlaceholders(template: string, data: any): string {
    if (!template) return ''
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  }
}