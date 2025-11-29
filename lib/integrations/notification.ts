export const notificationService = {
  async execute(config: any, previousData: any): Promise<any> {
    const { title, message, type = 'info' } = config;

    if (!('Notification' in window)) {
      return {
        success: false,
        error: 'This browser does not support notifications'
      };
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') {
      return {
        success: false,
        error: 'Notification permission denied'
      };
    }

    try {
      // Generate title and message from data if not provided
      const finalTitle = title || this.generateTitleFromData(previousData);
      const finalMessage = message || this.generateMessageFromData(previousData);

      const notification = new Notification(finalTitle, {
        body: finalMessage,
        icon: '/notification-icon.png',
        tag: 'workflow-automation',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return {
        success: true,
        data: {
          service: 'notification',
          title: finalTitle,
          message: finalMessage,
          type,
          timestamp: new Date().toISOString(),
          previous_data: previousData
        }
      };
    } catch (error: any) {
      console.error('Notification service error:', error);
      return {
        success: false,
        error: `Failed to show notification: ${error.message}`
      };
    }
  },

  generateTitleFromData(data: any): string {
    if (!data) return 'Workflow Completed';

    if (typeof data === 'object') {
      if (data.temperature !== undefined) return 'Weather Update';
      if (data.repository) return 'GitHub Update';
      if (data.url && data.method) return 'HTTP Request Complete';
      return 'Workflow Data Available';
    }
    
    return 'Workflow Result';
  },

  generateMessageFromData(data: any): string {
    if (!data) return 'Your workflow has been executed successfully.';

    if (typeof data === 'object') {
      if (data.temperature !== undefined) {
        return `${data.city || 'Location'}: ${data.temperature}°C, ${data.condition}`;
      }
      if (data.repository) {
        return `${data.repository}: ${data.stars || 0} stars`;
      }
      if (data.url && data.method) {
        return `${data.method} ${data.url}: ${data.status || 'Done'}`;
      }
      
      // Show first meaningful value
      const firstValue = Object.values(data).find(val => val && typeof val !== 'object');
      return String(firstValue || 'Data processed');
    }
    
    return String(data);
  }
};