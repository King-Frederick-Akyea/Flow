import { WorkflowGraph, WorkflowNode } from '@/types/workflow'
import { weatherService } from './integrations/weather'
import { emailService } from './integrations/email'
import { scheduler } from './scheduler'

class ExecutionEngine {
  private executionCount: number = 0

  async executeWorkflow(workflowId: string, graph: WorkflowGraph): Promise<any> {
    const executionId = `exec-${Date.now()}-${++this.executionCount}`
    const logs: string[] = []
    const context: any = { executionId }

    try {
      logs.push(`🚀 Starting workflow execution (ID: ${executionId})...`)

      // Find start node (trigger)
      const startNode = graph.nodes.find(node => node.type === 'trigger')
      if (!startNode) {
        throw new Error('No trigger node found')
      }

      logs.push(`▶️ Starting from: ${startNode.data.label}`)

      // If this is a scheduled workflow, register it
      if (startNode.data.config?.schedule) {
        logs.push(`📅 Schedule detected: ${startNode.data.config.schedule}`)
        this.registerScheduledWorkflow(workflowId, graph, startNode.data.config.schedule)
      }

      // Execute nodes in order following the connections
      let currentNode: WorkflowNode | undefined = startNode
      const executedNodes = new Set<string>()
      
      while (currentNode && !executedNodes.has(currentNode.id)) {
        executedNodes.add(currentNode.id)
        
        logs.push(`🔧 Executing: ${currentNode.data.label} (${currentNode.type})`)
        
        const result = await this.executeNode(currentNode, context)
        context[currentNode.id] = result
        context['current'] = result // Make available for next nodes
        
        logs.push(`✅ ${currentNode.data.label} completed`)
        
        // Find next node(s) - follow all outgoing edges
        const outgoingEdges = graph.edges.filter(e => e.source === currentNode!.id)
        if (outgoingEdges.length > 0) {
          // For now, take the first edge (we can enhance for branching logic later)
          const nextEdge = outgoingEdges[0]
          currentNode = graph.nodes.find(n => n.id === nextEdge.target)
        } else {
          currentNode = undefined
        }
      }

      logs.push('🎉 Workflow completed successfully!')
      return { 
        success: true, 
        logs, 
        context,
        executionId,
        timestamp: new Date().toISOString()
      }

    } catch (error: any) {
      logs.push(`❌ Error at step: ${error.message}`)
      return { 
        success: false, 
        logs, 
        error: error.message,
        executionId,
        timestamp: new Date().toISOString()
      }
    }
  }

  private registerScheduledWorkflow(workflowId: string, graph: WorkflowGraph, schedule: string) {
    scheduler.scheduleWorkflow(workflowId, schedule, async () => {
      try {
        console.log(`🕒 Automated execution triggered for workflow: ${workflowId}`)
        await this.executeWorkflow(workflowId, graph)
      } catch (error) {
        console.error(`❌ Automated execution failed for ${workflowId}:`, error)
      }
    })
  }

  private async executeNode(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}

    switch (node.type) {
      case 'trigger':
        return {
          triggeredAt: new Date().toISOString(),
          schedule: config.schedule,
          triggerType: 'scheduled',
          executionContext: context.executionId
        }
      
      case 'dataSource':
        if (config.source === 'weather') {
          const weatherData = await weatherService.getWeather(config)
          return {
            ...weatherData,
            retrievedAt: new Date().toISOString()
          }
        }
        throw new Error(`Unsupported data source: ${config.source}`)
      
      case 'action':
        if (config.action === 'email') {
          // Get the most recent data from context (weather data)
          const weatherData = this.findWeatherData(context)
          
          if (!config.to) {
            throw new Error('Email recipient (to) is required')
          }

          const emailConfig = {
            to: config.to,
            subject: config.subject,
            text: config.text
          }

          const emailData = {
            ...weatherData,
            subject: emailConfig.subject,
            text: emailConfig.text,
            executionTime: new Date().toLocaleString()
          }

          try {
            const result = await emailService.sendEmail(emailConfig, emailData)
            return { 
              ...result, 
              recipient: config.to,
              dataUsed: weatherData ? 'weather' : 'no data'
            }
          } catch (error: any) {
            throw new Error(`Email failed: ${error.message}`)
          }
        }
        throw new Error(`Unsupported action: ${config.action}`)
      
      case 'logic':
        // Basic condition evaluation - you can enhance this
        return {
          condition: config.condition,
          evaluated: true,
          result: this.evaluateCondition(config.condition, context)
        }

      case 'transform':
        // Simple data transformation
        return {
          originalData: context.current,
          transformed: true,
          description: config.description
        }

      case 'ai':
        // Placeholder for AI processing
        return {
          prompt: config.prompt,
          processed: true,
          result: `AI processed: ${config.prompt?.substring(0, 50)}...`
        }
      
      default:
        return { nodeType: node.type, executed: true }
    }
  }

  private findWeatherData(context: any): any {
    // Look for weather data in the context
    for (const key in context) {
      if (context[key] && context[key].temperature !== undefined) {
        return context[key]
      }
    }
    return null
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // Simple condition evaluation - you can make this more sophisticated
    try {
      // Extract variable and value (e.g., "temperature > 20")
      const weatherData = this.findWeatherData(context)
      if (!weatherData) return false

      // Simple template replacement
      let evaluatedCondition = condition
      for (const key in weatherData) {
        const value = weatherData[key]
        if (typeof value === 'number' || typeof value === 'string') {
          evaluatedCondition = evaluatedCondition.replace(
            new RegExp(key, 'g'), 
            typeof value === 'string' ? `"${value}"` : value
          )
        }
      }

      // Very basic evaluation - in production use a proper expression evaluator
      return eval(evaluatedCondition)
    } catch (error) {
      console.error('Condition evaluation error:', error)
      return false
    }
  }

  // Method to stop all scheduled workflows
  stopAllSchedules() {
    const schedules = scheduler.getScheduledWorkflows()
    schedules.forEach(workflow => {
      scheduler.unscheduleWorkflow(workflow.workflowId)
    })
  }

  // Method to get schedule status
  getScheduleStatus(workflowId: string) {
    const nextExecution = scheduler.getNextExecution(workflowId)
    return {
      scheduled: nextExecution !== null,
      nextExecution,
      workflows: scheduler.getScheduledWorkflows().map(w => ({
        id: w.workflowId,
        schedule: w.schedule,
        nextExecution: w.nextExecution
      }))
    }
  }
}

export const executionEngine = new ExecutionEngine()