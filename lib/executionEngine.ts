import { WorkflowGraph, WorkflowNode } from '@/types/workflow'
import { weatherService } from './integrations/weather'
import { emailService } from './integrations/email'

class ExecutionEngine {
  async executeWorkflow(workflowId: string, graph: WorkflowGraph): Promise<any> {
    const logs: string[] = []
    const context: any = {}

    try {
      logs.push('🚀 Starting workflow execution...')

      // Find start node (trigger)
      const startNode = graph.nodes.find(node => node.type === 'trigger')
      if (!startNode) {
        throw new Error('No trigger node found')
      }

      logs.push(`▶️ Starting from: ${startNode.data.label}`)

      // Execute nodes in order
      let currentNode: WorkflowNode | undefined = startNode
      while (currentNode) {
        logs.push(`🔧 Executing: ${currentNode.data.label}`)
        
        const result = await this.executeNode(currentNode, context)
        context[currentNode.id] = result
        
        logs.push(`✅ ${currentNode.data.label} completed`)
        
        // Find next node
        const edge = graph.edges.find(e => e.source === currentNode!.id)
        currentNode = edge ? graph.nodes.find(n => n.id === edge.target) : undefined
      }

      logs.push('🎉 Workflow completed successfully!')
      return { success: true, logs, context }

    } catch (error: any) {
      logs.push(`❌ Error: ${error.message}`)
      return { success: false, logs, error: error.message }
    }
  }

  private async executeNode(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}

    switch (node.type) {
      case 'trigger':
        return {
          triggeredAt: new Date().toISOString(),
          schedule: config.schedule,
          triggerType: config.triggerType
        }
      
      case 'dataSource':
        if (config.source === 'weather') {
          const weatherData = await weatherService.getWeather(config)
          return weatherData
        }
        return { data: 'Mock data' }
      
      case 'action':
        if (config.action === 'email') {
          // Get weather data from context
          const weatherNode = Object.values(context).find((val: any) => val.temperature !== undefined)
          const emailData = weatherNode || {}
          let subject = config.subject, text = config.text
          if (emailData.temperature !== undefined) {
            subject = `Weather Update: ${emailData.city || ''}`
            text = `Good ${getTimeOfDay()}, here's your weather update for ${emailData.city || 'your city'}:\n\nTemperature: ${emailData.temperature}°C\nCondition: ${emailData.condition}\nHumidity: ${emailData.humidity}%\nWind: ${emailData.windSpeed} m/s\n\nHave a great day!`
          }
          const emailConfig = {
            to: config.to,
            subject,
            text
          }
          try {
            const result = await emailService.sendEmail(emailConfig, emailData)
            return { ...result, recipient: config.to }
          } catch (error: any) {
            throw new Error(`Email failed: ${error.message}`)
          }
        }
        return { action: config.action, success: true }
      
      default:
        return { nodeType: node.type, executed: true }
    }
  }
}

export const executionEngine = new ExecutionEngine()

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}