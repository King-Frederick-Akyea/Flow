export const aiService = {
  async execute(config: any, inputData?: any): Promise<any> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return mock response when no API key is configured
      return {
        success: true,
        data: {
          response: "This is a mock AI response. Configure OpenAI API key for real responses.",
          usage: { prompt_tokens: 0, completion_tokens: 0 },
          model: config.model || 'gpt-3.5-turbo',
          source: 'mock',
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      const prompt = this.buildPrompt(config, inputData);
      
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
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          response: data.choices[0].message.content,
          usage: data.usage,
          model: data.model,
          source: 'openai',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: `Failed to process AI request: ${error.message}`
      };
    }
  },

  async summarize(inputData: any, config: any) {
    const prompt = `Please summarize the following content:\n\n${JSON.stringify(inputData, null, 2)}`;
    return this.execute({ ...config, prompt }, inputData);
  },

  async generateContent(inputData: any, config: any) {
    const prompt = config.prompt || 'Generate content based on the provided data';
    return this.execute({ ...config, prompt }, inputData);
  },

  buildPrompt(config: any, inputData: any): string {
    if (!inputData) {
      return config.prompt || '';
    }

    let prompt = config.prompt || '';
    
    // Replace template variables like {{fieldName}} with actual data
    prompt = prompt.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      // Handle nested properties with dot notation
      if (key.includes('.')) {
        const keys = key.split('.');
        let value = inputData;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        return value !== undefined ? String(value) : match;
      }
      
      return inputData[key] !== undefined ? String(inputData[key]) : match;
    });
    
    return prompt;
  }
};