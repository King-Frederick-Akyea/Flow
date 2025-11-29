export const emailService = {
  async execute(config: any, previousData: any): Promise<any> {
    const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY;
    const DEFAULT_FROM_EMAIL = process.env.NEXT_PUBLIC_DEFAULT_FROM_EMAIL;
    const EMAIL_SENDER_NAME = process.env.NEXT_PUBLIC_EMAIL_SENDER_NAME || 'Workflow Automation';

    if (!BREVO_API_KEY) {
      return {
        success: false,
        error: 'Brevo API key is not configured. Please add NEXT_PUBLIC_BREVO_API_KEY to your environment variables.'
      };
    }

    if (!DEFAULT_FROM_EMAIL) {
      return {
        success: false,
        error: 'Default from email is not configured. Please add NEXT_PUBLIC_DEFAULT_FROM_EMAIL to your environment variables.'
      };
    }

    if (!config.to) {
      return {
        success: false,
        error: 'Email recipient (to) is required'
      };
    }

    const subject = config.subject || this.generateSubject(previousData);
    const textContent = config.text || this.generateTextContent(previousData);
    const htmlContent = config.html || this.generateHTMLContent(previousData);

    const payload = {
      sender: { 
        name: EMAIL_SENDER_NAME, 
        email: DEFAULT_FROM_EMAIL 
      },
      to: [{ email: config.to }],
      subject,
      textContent,
      htmlContent,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `Brevo API error: ${errorData.message || response.statusText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: { 
          sent: true, 
          messageId: result.messageId,
          recipient: config.to,
          subject,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: `Failed to send email: ${error.message}`
      };
    }
  },

  generateSubject(data: any): string {
    if (!data) return 'Workflow Automation Update';

    // Try to extract meaningful subject based on data structure
    if (typeof data === 'object') {
      if (data.temperature !== undefined) {
        return `🌤️ Weather Update: ${data.city || 'Your Location'} - ${data.temperature}°C`;
      }
      if (data.repository) {
        return `📊 GitHub Update: ${data.repository}`;
      }
      if (data.url && data.method) {
        return `🌐 HTTP ${data.method} Response: ${data.url}`;
      }
      if (data.source) {
        return `📈 ${data.source.charAt(0).toUpperCase() + data.source.slice(1)} Data Update`;
      }
      if (data.action) {
        return `⚡ ${data.action.charAt(0).toUpperCase() + data.action.slice(1)} Action Completed`;
      }
      
      // Generic object - use first few keys
      const keys = Object.keys(data).slice(0, 3);
      return `📋 Workflow Data: ${keys.join(', ')}${keys.length < Object.keys(data).length ? '...' : ''}`;
    }
    
    return 'Workflow Automation Update';
  },

  generateTextContent(data: any): string {
    if (!data) return 'Your workflow has been executed successfully.';

    const header = `Good ${this.getTimeOfDay()}!\n\n`;
    const footer = '\n\n---\nSent via Workflow Automation';

    if (typeof data === 'object') {
      let content = 'Here are your workflow results:\n\n';
      
      // Handle different data structures
      if (data.temperature !== undefined) {
        content += `🌤️ WEATHER DATA:\n`;
        content += `📍 Location: ${data.city || 'Unknown'}\n`;
        content += `🌡️ Temperature: ${data.temperature}°${data.units === 'Celsius' ? 'C' : 'F'}\n`;
        content += `☁️ Condition: ${data.condition || 'Unknown'}\n`;
        if (data.humidity) content += `💧 Humidity: ${data.humidity}%\n`;
        if (data.windSpeed) content += `💨 Wind Speed: ${data.windSpeed} m/s\n`;
      }
      else if (data.repository) {
        content += `📊 GITHUB DATA:\n`;
        content += `📦 Repository: ${data.repository}\n`;
        if (data.stars !== undefined) content += `⭐ Stars: ${data.stars}\n`;
        if (data.forks !== undefined) content += `🍴 Forks: ${data.forks}\n`;
        if (data.open_issues !== undefined) content += `🐛 Open Issues: ${data.open_issues}\n`;
        if (data.language) content += `💻 Language: ${data.language}\n`;
      }
      else if (data.url && data.method) {
        content += `🌐 HTTP REQUEST:\n`;
        content += `🔗 URL: ${data.url}\n`;
        content += `📡 Method: ${data.method}\n`;
        content += `📊 Status: ${data.status || 'Unknown'}\n`;
      }
      else {
        // Generic object formatting
        content += '📋 WORKFLOW DATA:\n';
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object') {
            content += `${key}: ${JSON.stringify(value, null, 2)}\n`;
          } else {
            content += `${key}: ${value}\n`;
          }
        }
      }
      
      return header + content + footer;
    }
    
    // Handle primitive data types
    return header + `Workflow result: ${data}` + footer;
  },

  generateHTMLContent(data: any): string {
    if (!data) {
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .card { background: white; border-radius: 10px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; margin-top: 20px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
    .data-table th { background: #f8f9fa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Workflow Completed</h1>
      <p>Your automation workflow has been executed successfully</p>
    </div>
    
    <div class="content">
      <div class="card">
        <h3>Workflow Summary</h3>
        <p>The workflow executed without any specific data to display.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Sent via Workflow Automation • ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
      `.trim();
    }

    let content = '';

    if (typeof data === 'object') {
      if (data.temperature !== undefined) {
        content = `
        <div class="card">
          <h2>🌤️ Weather Update</h2>
          <p>Good ${this.getTimeOfDay()}! Here's your weather report for <strong>${data.city || 'your location'}</strong></p>
          <div class="metric">
            <span>🌡️ Temperature:</span>
            <strong>${data.temperature}°${data.units === 'Celsius' ? 'C' : 'F'}</strong>
          </div>
          <div class="metric">
            <span>☁️ Condition:</span>
            <strong>${data.condition || 'Unknown'}</strong>
          </div>
          ${data.humidity ? `<div class="metric"><span>💧 Humidity:</span><strong>${data.humidity}%</strong></div>` : ''}
          ${data.windSpeed ? `<div class="metric"><span>💨 Wind Speed:</span><strong>${data.windSpeed} m/s</strong></div>` : ''}
          ${data.pressure ? `<div class="metric"><span>📊 Pressure:</span><strong>${data.pressure} hPa</strong></div>` : ''}
        </div>
        `;
      }
      else if (data.repository) {
        content = `
        <div class="card">
          <h2>📊 GitHub Repository Update</h2>
          <div class="metric">
            <span>📦 Repository:</span>
            <strong>${data.repository}</strong>
          </div>
          ${data.stars !== undefined ? `<div class="metric"><span>⭐ Stars:</span><strong>${data.stars}</strong></div>` : ''}
          ${data.forks !== undefined ? `<div class="metric"><span>🍴 Forks:</span><strong>${data.forks}</strong></div>` : ''}
          ${data.open_issues !== undefined ? `<div class="metric"><span>🐛 Open Issues:</span><strong>${data.open_issues}</strong></div>` : ''}
          ${data.language ? `<div class="metric"><span>💻 Language:</span><strong>${data.language}</strong></div>` : ''}
          ${data.description ? `<div class="metric"><span>📝 Description:</span><strong>${data.description}</strong></div>` : ''}
        </div>
        `;
      }
      else if (data.url && data.method) {
        content = `
        <div class="card">
          <h2>🌐 HTTP Request</h2>
          <div class="metric">
            <span>🔗 URL:</span>
            <strong>${data.url}</strong>
          </div>
          <div class="metric">
            <span>📡 Method:</span>
            <strong>${data.method}</strong>
          </div>
          <div class="metric">
            <span>📊 Status:</span>
            <strong>${data.status || 'Unknown'}</strong>
          </div>
        </div>
        `;
      }
      else {
        // Generic object display
        content = `
        <div class="card">
          <h2>📋 Workflow Data</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data).map(([key, value]) => `
                <tr>
                  <td><strong>${key}</strong></td>
                  <td>${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        `;
      }
    } else {
      // Primitive data type
      content = `
      <div class="card">
        <h2>📋 Workflow Result</h2>
        <div class="metric">
          <span>Result:</span>
          <strong>${data}</strong>
        </div>
      </div>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .card { background: white; border-radius: 10px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; margin-top: 20px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
    .data-table th { background: #f8f9fa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Workflow Completed</h1>
      <p>Good ${this.getTimeOfDay()}! Your automation has finished running</p>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>Sent via Workflow Automation • ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  },

  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
};