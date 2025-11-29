export const smsService = {
  async execute(config: any, previousData: any): Promise<any> {
    const { 
      phoneNumber, 
      message,
      accountSid,
      authToken,
      fromNumber 
    } = config;

    const TWILIO_ACCOUNT_SID = accountSid || process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = authToken || process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const TWILIO_FROM_NUMBER = fromNumber || process.env.NEXT_PUBLIC_TWILIO_FROM_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return {
        success: false,
        error: 'Twilio credentials are not configured. Please add NEXT_PUBLIC_TWILIO_ACCOUNT_SID and NEXT_PUBLIC_TWILIO_AUTH_TOKEN to your environment variables.'
      };
    }

    if (!TWILIO_FROM_NUMBER) {
      return {
        success: false,
        error: 'Twilio from number is not configured. Please add NEXT_PUBLIC_TWILIO_FROM_NUMBER to your environment variables.'
      };
    }

    if (!phoneNumber) {
      return {
        success: false,
        error: 'Phone number is required for SMS'
      };
    }

    // If no message provided, generate one from data
    const finalMessage = message || this.generateMessageFromData(previousData);

    // Truncate message for SMS limits
    const truncatedMessage = finalMessage.length > 160 ? finalMessage.substring(0, 157) + '...' : finalMessage;

    try {
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      
      const formData = new URLSearchParams();
      formData.append('To', phoneNumber);
      formData.append('From', TWILIO_FROM_NUMBER);
      formData.append('Body', truncatedMessage);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Twilio API error: ${result.message || response.statusText}`
        };
      }

      return {
        success: true,
        data: {
          service: 'sms',
          to: phoneNumber,
          message: truncatedMessage,
          sid: result.sid,
          status: result.status,
          timestamp: new Date().toISOString(),
          previous_data: previousData
        }
      };
    } catch (error: any) {
      console.error('SMS service error:', error);
      return {
        success: false,
        error: `Failed to send SMS: ${error.message}`
      };
    }
  },

  generateMessageFromData(data: any): string {
    if (!data) return 'Workflow executed successfully.';

    if (typeof data === 'object') {
      if (data.temperature !== undefined) {
        return `Weather: ${data.city || ''} ${data.temperature}°C, ${data.condition}`;
      }
      if (data.repository) {
        return `GitHub: ${data.repository} - ${data.stars || 0} stars`;
      }
      if (data.url && data.method) {
        return `HTTP: ${data.method} ${data.url} - ${data.status || 'Completed'}`;
      }
      
      // Generic object - take first meaningful value
      const firstValue = Object.values(data).find(val => val && typeof val !== 'object');
      return `Workflow: ${firstValue || 'Completed'}`;
    }
    
    return `Workflow: ${data}`;
  }
};