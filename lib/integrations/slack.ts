export const slackService = {
  async sendMessage(config: any, data: any) {
    const webhookUrl = config.webhookUrl || process.env.SLACK_WEBHOOK_URL
    
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured')
    }

    const message = {
      text: this.replacePlaceholders(config.text, data),
      blocks: config.blocks || []
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`)
    }

    return { sent: true, service: 'slack' }
  },

  replacePlaceholders(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }
}