import { WorkflowGraph, WorkflowNode } from '@/types/workflow'
import { weatherService } from './integrations/weather'
import { emailService } from './integrations/email'

// Client-safe execution engine (no server dependencies)
class WorkflowExecutionEngine {
  private executionCount: number = 0
  private workflowCache: Map<string, WorkflowGraph> = new Map()

  async executeWorkflow(workflowId: string, graph: WorkflowGraph): Promise<any> {
    const executionId = `exec-${Date.now()}-${++this.executionCount}`
    const logs: string[] = []
    const context: any = { executionId }

    try {
      logs.push(` Starting workflow execution (ID: ${executionId})`)
      this.workflowCache.set(workflowId, graph)

      const startNode = graph.nodes.find(node => node.type === 'trigger')
      if (!startNode) {
        throw new Error('No trigger node found')
      }

      logs.push(` Starting from: ${startNode.data.label}`)

      // Execute nodes in sequence
      let currentNode: WorkflowNode | undefined = startNode
      const executedNodes = new Set<string>()
      
      while (currentNode && !executedNodes.has(currentNode.id)) {
        executedNodes.add(currentNode.id)
        
        logs.push(` Executing: ${currentNode.data.label}`)
        
        const result = await this.executeNode(currentNode, context)
        context[currentNode.id] = result
        context['current'] = result
        
        logs.push(` ${currentNode.data.label} completed`)
        
        const nextEdge = graph.edges.find(e => e.source === currentNode!.id)
        currentNode = nextEdge ? graph.nodes.find(n => n.id === nextEdge.target) : undefined
      }

      logs.push(' Workflow completed successfully!')
      
      return { 
        success: true, 
        logs, 
        context,
        executionId,
        timestamp: new Date().toISOString()
      }

    } catch (error: any) {
      logs.push(` Error: ${error.message}`)
      
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

    switch (node.type) {
      case 'trigger':
        return {
          triggeredAt: new Date().toISOString(),
          schedule: config.schedule,
          triggerType: 'manual',
          executionContext: context.executionId
        }
      
      case 'dataSource':
        return await this.executeDataSource(node, config, context)
      
      case 'action':
        return await this.executeAction(node, config, context)
      
      case 'logic':
        return await this.executeLogic(node, config, context)
      
      case 'transform':
        return await this.executeTransform(node, config, context)
      
      case 'ai':
        return await this.executeAI(node, config, context)
      
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async executeDataSource(node: WorkflowNode, config: any, context: any): Promise<any> {
    const source = config.source

    switch (source) {
      case 'weather':
        return await weatherService.getWeather(config)
      
      default:
        throw new Error(`Unsupported data source: ${source}`)
    }
  }

  private async executeAction(node: WorkflowNode, config: any, context: any): Promise<any> {
    const action = config.action
    const previousData = context.current || this.findPreviousData(context)

    switch (action) {
      case 'email':
        if (!config.to) {
          throw new Error('Email recipient (to) is required')
        }
        return await emailService.sendEmail(config, previousData)
      
      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  }

  private async executeLogic(node: WorkflowNode, config: any, context: any): Promise<any> {
    const inputData = context.current || this.findPreviousData(context)
    
    if (config.condition) {
      const result = this.evaluateCondition(config.condition, inputData, context)
      return {
        condition: config.condition,
        result,
        dataUsed: inputData
      }
    }

    return {
      operation: 'logic',
      executed: true,
      data: inputData
    }
  }

  private async executeTransform(node: WorkflowNode, config: any, context: any): Promise<any> {
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
      return transformed
    }

    return {
      operation: 'transform',
      input: inputData,
      executed: true
    }
  }

  private async executeAI(node: WorkflowNode, config: any, context: any): Promise<any> {
    const inputData = context.current || this.findPreviousData(context)
    
    return {
      operation: 'ai',
      prompt: config.prompt,
      input: inputData,
      result: `AI processed: ${config.prompt?.substring(0, 50)}...`,
      executed: true
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