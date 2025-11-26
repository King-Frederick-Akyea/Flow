export const openAIService = {
  async process(config: any, inputData: any) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      // Return mock AI response
      return {
        response: "This is a mock AI response. Configure OpenAI API key for real responses.",
        usage: { prompt_tokens: 0, completion_tokens: 0 },
        model: config.model || 'gpt-3.5-turbo',
        source: 'mock'
      }
    }

    try {
      const prompt = this.buildPrompt(config, inputData)
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        response: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        source: 'openai'
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to process AI request')
    }
  },

  async summarize(inputData: any, config: any) {
    const prompt = `Please summarize the following content:\n\n${JSON.stringify(inputData, null, 2)}`
    
    return this.process({ ...config, prompt }, inputData)
  },

  async generateContent(inputData: any, config: any) {
    const prompt = config.prompt || 'Generate content based on the provided data'
    
    return this.process({ ...config, prompt }, inputData)
  },

  buildPrompt(config: any, inputData: any): string {
    let prompt = config.prompt || ''
    
    // Replace placeholders in prompt with actual data
    prompt = prompt.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return inputData[key] || match
    })
    
    return prompt
  }
}