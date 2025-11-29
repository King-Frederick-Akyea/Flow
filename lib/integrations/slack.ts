export const slackService = {
  async execute(config: any, previousData: any): Promise<any> {
    const { webhookUrl, message, channel, username = 'Workflow Bot' } = config;

    if (!webhookUrl) {
      return {
        success: false,
        error: 'Slack webhook URL is required'
      };
    }

    // If no message provided, generate one from data
    const finalMessage = message || this.generateMessageFromData(previousData);

    try {
      const payload = {
        text: finalMessage,
        channel: channel,
        username: username,
        icon_emoji: ':robot_face:',
        attachments: previousData ? [{
          color: '#36a64f',
          fields: this.createSlackFields(previousData),
          ts: Math.floor(Date.now() / 1000)
        }] : []
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Slack API error: ${response.status} ${response.statusText}`
        };
      }

      return {
        success: true,
        data: {
          service: 'slack',
          channel: channel || 'default',
          message: finalMessage,
          timestamp: new Date().toISOString(),
          previous_data: previousData
        }
      };
    } catch (error: any) {
      console.error('Slack service error:', error);
      return {
        success: false,
        error: `Failed to send Slack message: ${error.message}`
      };
    }
  },

  generateMessageFromData(data: any): string {
    if (!data) return 'Workflow executed successfully.';

    if (typeof data === 'object') {
      if (data.temperature !== undefined) {
        return `🌤️ Weather Update: ${data.city || 'Unknown location'} - ${data.temperature}°C, ${data.condition}`;
      }
      if (data.repository) {
        return `📊 GitHub Update: ${data.repository} - ${data.stars || 0} stars, ${data.forks || 0} forks`;
      }
      if (data.url && data.method) {
        return `🌐 HTTP ${data.method} Request: ${data.url} - Status ${data.status || 'Unknown'}`;
      }
      
      // Generic object
      const mainInfo = Object.entries(data)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      return `📋 Workflow Data: ${mainInfo}${Object.keys(data).length > 3 ? '...' : ''}`;
    }
    
    return `Workflow result: ${data}`;
  },

  createSlackFields(data: any): any[] {
    if (!data || typeof data !== 'object') return [];

    const fields = [];
    
    if (data.temperature !== undefined) {
      fields.push(
        { title: 'Temperature', value: `${data.temperature}°${data.units === 'Celsius' ? 'C' : 'F'}`, short: true },
        { title: 'Condition', value: data.condition || 'Unknown', short: true },
        { title: 'Location', value: data.city || 'Unknown', short: true }
      );
      if (data.humidity) fields.push({ title: 'Humidity', value: `${data.humidity}%`, short: true });
    }
    else if (data.repository) {
      fields.push(
        { title: 'Repository', value: data.repository, short: true }
      );
      if (data.stars !== undefined) fields.push({ title: 'Stars', value: data.stars.toString(), short: true });
      if (data.forks !== undefined) fields.push({ title: 'Forks', value: data.forks.toString(), short: true });
      if (data.language) fields.push({ title: 'Language', value: data.language, short: true });
    }
    else {
      // Generic fields from object
      Object.entries(data)
        .slice(0, 6)
        .forEach(([key, value]) => {
          if (value && typeof value === 'object') return;
          fields.push({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value).substring(0, 50),
            short: true
          });
        });
    }

    return fields;
  }
};