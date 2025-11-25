import { WorkflowGraph, WorkflowNode, WorkflowRun } from '@/types/workflow'
import { supabase } from './supabase'

class ExecutionEngine {
  async executeWorkflow(workflowId: string, graph: WorkflowGraph): Promise<any> {
    // Create workflow run record
    const { data: run, error } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        status: 'running',
        logs: []
      })
      .select()
      .single()

    if (error) throw error

    try {
      const result = await this.executeGraph(graph, run.id)
      
      // Update run as completed
      await supabase
        .from('workflow_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          logs: result.logs
        })
        .eq('id', run.id)

      return result
    } catch (error) {
      // Update run as failed
      await supabase
        .from('workflow_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: (error as Error).message
        })
        .eq('id', run.id)

      throw error
    }
  }

  private async executeGraph(graph: WorkflowGraph, runId: string): Promise<any> {
    const logs: string[] = []
    const context: any = {}

    // Find start node (trigger)
    const startNode = graph.nodes.find(node => node.type === 'trigger')
    if (!startNode) throw new Error('No trigger node found')

    logs.push(`Starting execution from trigger: ${startNode.data.label}`)

    // Execute nodes in order (simplified linear execution)
    let currentNode: WorkflowNode | undefined = startNode
    while (currentNode) {
      const result = await this.executeNode(currentNode, context)
      logs.push(`Executed ${currentNode.data.label}: ${JSON.stringify(result)}`)
      
      // Find next node (simplified - first connected node)
      const edge = graph.edges.find(e => e.source === currentNode!.id)
      currentNode = edge ? graph.nodes.find(n => n.id === edge.target) : undefined
    }

    return { logs, finalContext: context }
  }

  private async executeNode(node: WorkflowNode, context: any): Promise<any> {
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
      
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async executeTrigger(node: WorkflowNode, context: any): Promise<any> {
    // Simulate trigger execution
    return { triggeredAt: new Date().toISOString(), type: node.data.config?.schedule }
  }

  private async executeDataSource(node: WorkflowNode, context: any): Promise<any> {
    const source = node.data.config?.source
    
    switch (source) {
      case 'weather':
        // Simulate weather API call
        return { temperature: 72, condition: 'Sunny', city: 'New York' }
      
      case 'github':
        // Simulate GitHub API call
        return { commits: 5, issues: 2, pullRequests: 1 }
      
      default:
        return { data: `Mock data from ${source}` }
    }
  }

  private async executeLogic(node: WorkflowNode, context: any): Promise<any> {
    // Simple condition logic simulation
    return { conditionMet: true, processed: true }
  }

  private async executeTransform(node: WorkflowNode, context: any): Promise<any> {
    // Data transformation simulation
    return { transformed: true, timestamp: new Date().toISOString() }
  }

  private async executeAction(node: WorkflowNode, context: any): Promise<any> {
    const action = node.data.config?.action
    
    switch (action) {
      case 'email':
        // Simulate sending email
        return { sent: true, to: 'user@example.com', subject: 'Workflow Notification' }
      
      case 'slack':
        // Simulate Slack message
        return { sent: true, channel: '#general', message: 'Workflow completed' }
      
      default:
        return { action: `Executed ${action}`, success: true }
    }
  }
}

export const executionEngine = new ExecutionEngine()