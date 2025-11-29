export const httpService = {
  async execute(config: any, previousData: any): Promise<any> {
    const { 
      url, 
      method = 'GET', 
      headers = {}, 
      body, 
      action = 'request',
      timeout = 10000 
    } = config;

    if (!url) {
      return {
        success: false,
        error: 'URL is required for HTTP service'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestBody = body || (previousData ? JSON.stringify(previousData) : undefined);
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: {
            status: response.status,
            statusText: response.statusText,
            response: responseData
          }
        };
      }

      return {
        success: true,
        data: {
          action,
          url,
          method: method.toUpperCase(),
          status: response.status,
          data: responseData,
          timestamp: new Date().toISOString(),
          previous_data: previousData
        }
      };
    } catch (error: any) {
      console.error('HTTP service error:', error);
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      return {
        success: false,
        error: `HTTP request failed: ${error.message}`
      };
    }
  }
};