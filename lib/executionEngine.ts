import { WorkflowGraph, WorkflowNode } from '@/types/workflow'
import { serviceRegistry, getService, ServiceResult } from './integrations'

// Client-safe execution engine (no server dependencies)
class WorkflowExecutionEngine {
  private executionCount: number = 0
  private workflowCache: Map<string, WorkflowGraph> = new Map()

  async executeWorkflow(workflowId: string, graph: WorkflowGraph): Promise<any> {
    const executionId = `exec-${Date.now()}-${++this.executionCount}`
    const logs: string[] = []
    const context: any = { executionId }

    try {
      logs.push(`🚀 Starting workflow execution (ID: ${executionId})`)
      this.workflowCache.set(workflowId, graph)

      const startNode = graph.nodes.find(node => node.type === 'trigger')
      if (!startNode) {
        throw new Error('No trigger node found')
      }

      logs.push(`📍 Starting from: ${startNode.data.label}`)

      // Execute nodes in sequence following the connections
      let currentNodeQueue: WorkflowNode[] = [startNode]
      const executedNodes = new Set<string>()
      
      while (currentNodeQueue.length > 0) {
        // Remove the next node from the queue
        const currentNode = currentNodeQueue.shift()
        if (!currentNode || executedNodes.has(currentNode.id)) continue
        executedNodes.add(currentNode.id)
        
        logs.push(`⚡ Executing: ${currentNode.data.label} (${currentNode.type})`)

        const result = await this.executeNode(currentNode, context)
        context[currentNode.id] = result
        context['current'] = result
        logs.push(`✅ ${currentNode.data.label} completed`)
        
        // Find ALL outgoing edges from this node
        const outgoingEdges = graph.edges.filter(e => e.source === currentNode.id)
        // For each outgoing node, add to the queue if it hasn't been executed
        for (const edge of outgoingEdges) {
          const nextNode = graph.nodes.find(n => n.id === edge.target)
          if (nextNode && !executedNodes.has(nextNode.id)) {
            currentNodeQueue.push(nextNode)
          }
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
      logs.push(`❌ Error: ${error.message}`)
      
      return { 
        success: false, 
        logs, 
        error: error.message,
        executionId,
        timestamp: new Date().toISOString()
      }
    }
  }

  private async executeNode(node: WorkflowNode, context: any): Promise<any> {
    const config = node.data.config || {}
    const nodeData = node.data

    try {
      switch (node.type) {
        case 'trigger':
          return {
            triggeredAt: new Date().toISOString(),
            schedule: config.schedule,
            triggerType: config.triggerType || 'scheduled',
            executionContext: context.executionId
          }
        
        case 'dataSource':
          return await this.executeDataSource(nodeData, config, context)
        
        case 'action':
          return await this.executeAction(nodeData, config, context)
        
        case 'logic':
          return await this.executeLogic(nodeData, config, context)
        
        case 'transform':
          return await this.executeTransform(nodeData, config, context)
        
        case 'ai':
          return await this.executeAI(nodeData, config, context)
        
        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }
    } catch (error: any) {
      throw new Error(`Failed to execute ${node.data.label}: ${error.message}`)
    }
  }

  private async executeDataSource(nodeData: any, config: any, context: any): Promise<any> {
    const source = config.source

    if (!source) {
      throw new Error('Data source not specified')
    }

    try {
      const service = getService('dataSource', source)
      const result: ServiceResult = await service.execute(config, context)
      
      if (!result.success) {
        throw new Error(result.error || `Data source ${source} failed`)
      }

      return {
        source,
        data: result.data,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      throw new Error(`Data source ${source} error: ${error.message}`)
    }
  }

  private async executeAction(nodeData: any, config: any, context: any): Promise<any> {
    const action = config.action

    if (!action) {
      throw new Error('Action not specified')
    }

    try {
      const service = getService('action', action)
      const previousData = context.current || this.findPreviousData(context)
      const result: ServiceResult = await service.execute(config, previousData)
      
      if (!result.success) {
        throw new Error(result.error || `Action ${action} failed`)
      }

      return {
        action,
        result: result.data,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      throw new Error(`Action ${action} error: ${error.message}`)
    }
  }

  private async executeLogic(nodeData: any, config: any, context: any): Promise<any> {
    const inputData = context.current || this.findPreviousData(context)
    
    if (config.condition) {
      const result = this.evaluateCondition(config.condition, inputData, context)
      return {
        type: 'condition',
        condition: config.condition,
        result,
        dataUsed: inputData,
        timestamp: new Date().toISOString()
      }
    }

    return {
      type: 'logic',
      executed: true,
      data: inputData,
      timestamp: new Date().toISOString()
    }
  }

  private async executeTransform(nodeData: any, config: any, context: any): Promise<any> {
    const inputData = context.current || this.findPreviousData(context)
    
    if (config.mapping && typeof inputData === 'object') {
      const transformed: any = {}
      for (const [key, value] of Object.entries(config.mapping)) {
        if (typeof value === 'string' && value.startsWith('$.')) {
          const path = value.substring(2)
          transformed[key] = this.getNestedValue(inputData, path)
        } else {
          transformed[key] = value
        }
      }
      return {
        type: 'transform',
        transformed,
        original: inputData,
        timestamp: new Date().toISOString()
      }
    }

    return {
      type: 'transform',
      input: inputData,
      executed: true,
      timestamp: new Date().toISOString()
    }
  }

  private async executeAI(nodeData: any, config: any, context: any): Promise<any> {
    const inputData = context.current || this.findPreviousData(context);
    
    try {
      const service = getService('ai', 'ai');
      const result: ServiceResult = await service.execute(config, inputData);
      
      if (!result.success) {
        // Return the error in a structured way instead of throwing
        return {
          type: 'ai',
          prompt: config.prompt,
          input: inputData,
          error: result.error,
          success: false,
          timestamp: new Date().toISOString()
        };
      }

      return {
        type: 'ai',
        prompt: config.prompt,
        input: inputData,
        result: result.data,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      // Fallback error handling
      return {
        type: 'ai',
        prompt: config.prompt,
        input: inputData,
        error: `AI processing error: ${error.message}`,
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper methods
  private findPreviousData(context: any): any {
    const keys = Object.keys(context).filter(key => !['executionId', 'current'].includes(key))
    
    for (let i = keys.length - 1; i >= 0; i--) {
      const value = context[keys[i]]
      if (value && typeof value === 'object' && !value.triggeredAt) {
        return value
      }
    }
    return null
  }

  private evaluateCondition(condition: string, data: any, context: any): boolean {
    try {
      let evaluated = condition
      
      if (data && typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'number' || typeof value === 'string') {
            evaluated = evaluated.replace(
              new RegExp(`data\\.${key}`, 'g'),
              typeof value === 'string' ? `"${value}"` : value.toString()
            )
          }
        }
      }

      evaluated = evaluated.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? JSON.stringify(context[key]) : 'undefined'
      })

      return Function(`"use strict"; return (${evaluated})`)()
    } catch (error) {
      console.error('Condition evaluation error:', error)
      return false
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // For testing - manually register a workflow
  registerWorkflowForTesting(workflowId: string, graph: WorkflowGraph) {
    this.workflowCache.set(workflowId, graph)
    console.log(`📝 Registered workflow ${workflowId} for testing`)
  }
}

export const executionEngine = new WorkflowExecutionEngine()