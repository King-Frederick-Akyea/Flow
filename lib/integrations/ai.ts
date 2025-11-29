interface OpenAIConfig {
  apiKey?: string;
  model?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  aiAction?: string;
}

interface OpenAIResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
  source: string;
}

interface ServiceResult {
  success: boolean;
  data?: OpenAIResponse;
  error?: string;
}

export const openAIService = {
  async execute(config: OpenAIConfig, inputData: any): Promise<ServiceResult> {
    const apiKey = config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    // If no API key, return mock response
    if (!apiKey) {
      console.warn('OpenAI API key not configured. Using mock response.');
      return {
        success: true,
        data: {
          response: "This is a mock AI response. Configure OpenAI API key for real responses. You can get an API key from https://platform.openai.com/api-keys",
          usage: { prompt_tokens: 0, completion_tokens: 0 },
          model: config.model || 'gpt-3.5-turbo',
          source: 'mock'
        }
      };
    }

    try {
      const prompt = this.buildPrompt(config, inputData);
      
      console.log('Sending request to OpenAI API...');
      
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
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        
        // Handle specific HTTP status codes
        switch (response.status) {
          case 429:
            errorMessage = 'OpenAI API rate limit exceeded. Please wait a moment and try again. If you just created your API key, it may take a few minutes to activate.';
            break;
          case 401:
            errorMessage = 'OpenAI API key is invalid. Please check your API key configuration.';
            break;
          case 403:
            errorMessage = 'OpenAI API access forbidden. Your API key may not have permission to access this model.';
            break;
          case 500:
            errorMessage = 'OpenAI API server error. Please try again later.';
            break;
          default:
            try {
              const errorData = await response.json();
              errorMessage = `OpenAI API error: ${errorData.error?.message || response.statusText}`;
            } catch {
              // If we can't parse JSON, use the status text
            }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          response: data.choices[0].message.content,
          usage: data.usage,
          model: data.model,
          source: 'openai'
        }
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Return a user-friendly error message
      return {
        success: false,
        error: error.message || 'Unknown error occurred while processing AI request'
      };
    }
  },

  async summarize(inputData: any, config: OpenAIConfig): Promise<ServiceResult> {
    const prompt = `Please summarize the following content:\n\n${JSON.stringify(inputData, null, 2)}`;
    
    return this.execute({ ...config, prompt }, inputData);
  },

  async generateContent(inputData: any, config: OpenAIConfig): Promise<ServiceResult> {
    const prompt = config.prompt || 'Generate content based on the provided data';
    
    return this.execute({ ...config, prompt }, inputData);
  },

  buildPrompt(config: OpenAIConfig, inputData: any): string {
    let prompt = config.prompt || '';
    
    if (!inputData) {
      return prompt;
    }

    // Handle template variables like {{fieldName}}
    prompt = prompt.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      return inputData[key] !== undefined ? String(inputData[key]) : match;
    });
    
    // Handle nested object access with dot notation
    prompt = prompt.replace(/\{\{([\w\.]+)\}\}/g, (match: string, path: string) => {
      const value = this.getNestedValue(inputData, path);
      return value !== undefined ? String(value) : match;
    });
    
    return prompt;
  },

  getNestedValue(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }
    
    return path.split('.').reduce((current: any, key: string) => {
      return current !== null && current !== undefined ? current[key] : undefined;
    }, obj);
  }
};