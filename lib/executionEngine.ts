import { WorkflowGraph, WorkflowNode } from '@/types/workflow'
import { weatherService } from './integrations/weather'
import { emailService } from './integrations/email'

class ExecutionEngine {
  async executeWorkflow(workflowId: string, graph: WorkflowGraph): Promise<any> {
    const logs: string[] = []
    const context: any = {}

    try {
      logs.push(`🚀 Starting workflow execution: ${workflowId}`)

      // Find start node (trigger)
      const startNode = graph.nodes.find(node => node.type === 'trigger')
      if (!startNode) {
        throw new Error('No trigger node found in workflow')
      }

      logs.push(`▶️ Starting execution from trigger: ${startNode.data.label}`)

      // Execute nodes in order following connections
      let currentNode: WorkflowNode | undefined = startNode
      while (currentNode) {
        logs.push(`🔧 Executing: ${currentNode.data.label}`)
        
        const result = await this.executeNode(currentNode, context)
        context[currentNode.id] = result
        
        logs.push(`✅ ${currentNode.data.label} completed`)
        
        if (result && typeof result === 'object') {
          const logData = this.getLoggableData(result)
          if (Object.keys(logData).length > 0) {
            logs.push(`📊 Output: ${JSON.stringify(logData)}`)
          }
        }

        // Find next node
        const edge = graph.edges.find(e => e.source === currentNode!.id)
        currentNode = edge ? graph.nodes.find(n => n.id === edge.target) : undefined
      }

      logs.push('🎉 Workflow execution completed successfully!')
      return { success: true, logs, context }

    } catch (error: any) {
      logs.push(`❌ Workflow execution failed: ${error.message}`)
      return { success: false, logs, error: error.message }
    }
  }

  private getLoggableData(result: any): any {
    if (!result || typeof result !== 'object') return result
    
    const { apiKey, password, token, ...safeData } = result
    return safeData
  }

  private async executeNode(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}

    switch (node.type) {
      case 'trigger':
        return this.executeTrigger(node, context)
      
      case 'dataSource':
        return this.executeDataSource(node, context)
      
      case 'logic':
        return this.executeLogic(node, context)
      
      case 'transform':
        return this.executeTransform(node, context)
      
      case 'action':
        return this.executeAction(node, context)
      
      case 'ai':
        return this.executeAI(node, context)
      
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async executeTrigger(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    
    return { 
      triggeredAt: new Date().toISOString(),
      triggerType: config.triggerType || 'manual',
      schedule: config.schedule,
      cron: config.cron
    }
  }

  private async executeDataSource(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    const source = config.source

    if (!source) {
      throw new Error('Data source node missing source configuration')
    }

    switch (source) {
      case 'weather':
        return await weatherService.getWeather(config)
      
      case 'github':
        // Simulate GitHub API call
        return { 
          commits: Math.floor(Math.random() * 10),
          issues: Math.floor(Math.random() * 5),
          pullRequests: Math.floor(Math.random() * 3),
          repository: config.repository
        }
      
      case 'http':
        // Simulate HTTP request
        return {
          status: 200,
          data: `Response from ${config.url}`,
          method: config.method
        }
      
      case 'database':
        // Simulate database query
        return {
          rows: [{ id: 1, data: 'Sample data' }],
          query: config.query
        }
      
      default:
        throw new Error(`Unsupported data source: ${source}`)
    }
  }

  private async executeLogic(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    const condition = config.condition

    if (!condition) {
      return { conditionMet: true }
    }

    // Get data from previous nodes for condition evaluation
    const previousData = this.getPreviousNodeData(context)
    
    // Simple condition evaluation
    try {
      const conditionMet = this.evaluateSimpleCondition(condition, previousData)
      return { conditionMet, condition }
    } catch (error) {
      return { conditionMet: false, error: 'Condition evaluation failed' }
    }
  }

  private getPreviousNodeData(context: any): any {
    // Get data from the last executed node
    const nodeIds = Object.keys(context)
    if (nodeIds.length === 0) return {}
    
    const lastNodeId = nodeIds[nodeIds.length - 1]
    return context[lastNodeId] || {}
  }

  private evaluateSimpleCondition(condition: string, data: any): boolean {
    // Very simple condition evaluation for demo
    if (condition.includes('temperature')) {
      const temp = data.temperature
      if (temp === undefined) return false

      if (condition.includes('>')) {
        const value = parseInt(condition.split('>')[1].trim())
        return temp > value
      }
      if (condition.includes('<')) {
        const value = parseInt(condition.split('<')[1].trim())
        return temp < value
      }
    }
    
    return true // Default to true if condition can't be evaluated
  }

  private async executeTransform(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    const previousData = this.getPreviousNodeData(context)
    
    return {
      transformed: true,
      originalData: previousData,
      transformType: config.transformType,
      description: config.description
    }
  }

  private async executeAction(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    const action = config.action

    if (!action) {
      throw new Error('Action node missing action configuration')
    }

    // Get data from previous nodes for placeholders
    const previousData = this.getPreviousNodeData(context)

    switch (action) {
      case 'email':
        try {
          const emailConfig = {
            to: config.to,
            subject: config.subject,
            text: config.text,
            html: config.html,
            from: config.from
          }

          const result = await emailService.sendEmail(emailConfig, previousData)
          return {
            ...result,
            action: 'email',
            recipient: config.to
          }
        } catch (error: any) {
          throw new Error(`Failed to send email: ${error.message}`)
        }
      
      case 'slack':
        // Simulate Slack message
        return {
          sent: true,
          action: 'slack',
          message: config.message,
          webhookUrl: config.webhookUrl
        }
      
      case 'webhook':
        // Simulate webhook call
        return {
          sent: true,
          action: 'webhook',
          url: config.webhookUrl
        }
      
      case 'sms':
        // Simulate SMS
        return {
          sent: true,
          action: 'sms',
          to: config.phoneNumber
        }
      
      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  }

  private async executeAI(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    const previousData = this.getPreviousNodeData(context)
    
    // Simulate AI processing
    return {
      processed: true,
      action: config.aiAction,
      prompt: config.prompt,
      inputData: previousData
    }
  }
}

export const executionEngine = new ExecutionEngine()