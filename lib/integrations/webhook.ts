export const webhookService = {
  async trigger(config: any, data: any) {
    if (!config.url) {
      throw new Error('Webhook URL is required')
    }

    const payload = {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify({
        workflowData: data,
        timestamp: new Date().toISOString(),
        ...config.body
      }),
    }

    const response = await fetch(config.url, payload)

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`)
    }

    let responseData
    try {
      responseData = await response.json()
    } catch {
      responseData = await response.text()
    }

    return {
      status: response.status,
      response: responseData,
      timestamp: new Date().toISOString()
    }
  }
}