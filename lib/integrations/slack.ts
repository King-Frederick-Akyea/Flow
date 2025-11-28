export const slackService = {
  async sendMessage(config: any, data: any) {
    const webhookUrl = config.webhookUrl || process.env.SLACK_WEBHOOK_URL

    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required')
    }

    const message = {
      text: config.text || 'Workflow notification',
      blocks: config.blocks || [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: data ? `Workflow data: \`\`\`${JSON.stringify(data, null, 2)}\`\`\`` : 'Workflow executed successfully'
          }
        }
      ]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
    }

    return { 
      success: true, 
      channel: config.channel,
      timestamp: new Date().toISOString()
    }
  }
}