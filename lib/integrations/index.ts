// Service registry for all node types
import { weatherService } from './weather';
import { emailService } from './email';
import { githubService } from './github';
import { slackService } from './slack';
import { httpService } from './http';
import { smsService } from './sms';
import { notificationService } from './notification';
import { openAIService } from './ai';

export interface ServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BaseService {
  execute(config: any, context?: any): Promise<ServiceResult>;
}

// Define the service registry type
interface ServiceRegistry {
  [key: string]: BaseService;
}

// Registry of all available services
export const serviceRegistry: ServiceRegistry = {
  // Data Sources
  weather: weatherService,
  github: githubService,
  http: httpService,
  database: { 
    execute: async (config: any) => ({ 
      success: true, 
      data: { message: 'Database query executed', query: config.query } 
    }) 
  },
  
  // Actions
  email: emailService,
  slack: slackService,
  webhook: httpService, // Reuse http service for webhooks
  sms: smsService,
  notification: notificationService,
  
  // Logic & AI
  condition: { 
    execute: async (config: any, context: any) => ({ 
      success: true, 
      data: { 
        condition: config.condition, 
        result: true,
        evaluated: config.condition 
      } 
    }) 
  },
  ai: openAIService, // Replace the mock with real AI service
  transform: { 
    execute: async (config: any, context: any) => ({ 
      success: true, 
      data: { 
        transformed: context.current,
        mapping: config.mapping 
      } 
    }) 
  }
};

// Helper to get service by type and action/source
export function getService(nodeType: string, actionOrSource: string): BaseService {
  const key = actionOrSource || nodeType;
  const service = serviceRegistry[key];
  
  if (!service) {
    throw new Error(`No service found for ${nodeType}.${actionOrSource}`);
  }
  
  return service;
}