'use client'

interface ScheduledWorkflow {
  workflowId: string
  executeCallback: () => Promise<void>
  interval: NodeJS.Timeout
  nextExecution: Date
  schedule: string
  graph: any // Workflow graph data
  isActive: boolean
  executionCount: number
  createdAt: Date
  updatedAt: Date
}

class AdvancedClientScheduler {
  private schedules: Map<string, ScheduledWorkflow> = new Map()
  private isInitialized: boolean = false

  // Initialize scheduler and restore from localStorage
  initialize() {
    if (this.isInitialized) return
    
    console.log('🔄 Initializing advanced client scheduler...')
    this.isInitialized = true
    
    const storedSchedules = this.getStoredSchedules()
    
    storedSchedules.forEach(schedule => {
      if (schedule.isActive) {
        this.restoreSchedule(schedule)
      }
    })
    
    console.log(`✅ Advanced scheduler initialized with ${storedSchedules.length} schedules`)
  }

  async scheduleWorkflow(workflowId: string, schedule: string, graph: any): Promise<ScheduledWorkflow> {
    // Clear existing schedule first
    this.unscheduleWorkflow(workflowId)

    console.log(`📅 Advanced scheduling workflow ${workflowId} with schedule: ${schedule}`)

    const executeCallback = this.createExecuteCallback(workflowId, graph)
    const intervalMs = this.getIntervalMs(schedule)
    const nextExecution = this.calculateNextExecution(schedule)

    const scheduledWorkflow: ScheduledWorkflow = {
      workflowId,
      executeCallback,
      interval: this.createInterval(workflowId, executeCallback, intervalMs),
      nextExecution,
      schedule,
      graph,
      isActive: true,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.schedules.set(workflowId, scheduledWorkflow)
    this.saveToStorage(scheduledWorkflow)

    console.log(`✅ Successfully scheduled workflow ${workflowId}, next execution: ${nextExecution.toLocaleString()}`)
    return scheduledWorkflow
  }

  unscheduleWorkflow(workflowId: string) {
    const existing = this.schedules.get(workflowId)
    if (existing) {
      clearInterval(existing.interval)
      this.schedules.delete(workflowId)
      
      // Mark as inactive in storage instead of deleting
      this.markInactiveInStorage(workflowId)
      
      console.log(`🗑️ Unscheduled workflow: ${workflowId}`)
    }
  }

  // Execute workflow immediately
  async triggerWorkflowNow(workflowId: string): Promise<boolean> {
    const scheduled = this.schedules.get(workflowId)
    if (!scheduled) {
      console.warn(`⚠️ Workflow ${workflowId} not found for immediate execution`)
      return false
    }

    try {
      console.log(`⚡ Immediately executing workflow: ${workflowId}`)
      await scheduled.executeCallback()
      return true
    } catch (error) {
      console.error(`❌ Error executing workflow ${workflowId}:`, error)
      return false
    }
  }

  getScheduledWorkflows(): ScheduledWorkflow[] {
    return Array.from(this.schedules.values()).filter(sw => sw.isActive)
  }

  getNextExecution(workflowId: string): Date | null {
    const scheduled = this.schedules.get(workflowId)
    return scheduled ? scheduled.nextExecution : null
  }

  // Get workflow status
  getWorkflowStatus(workflowId: string) {
    const scheduled = this.schedules.get(workflowId)
    if (!scheduled) return 'not_scheduled'
    
    return scheduled.isActive ? 'active' : 'inactive'
  }

  // Update workflow schedule
  async updateSchedule(workflowId: string, newSchedule: string) {
    const existing = this.schedules.get(workflowId)
    if (!existing) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    console.log(`🔄 Updating schedule for workflow ${workflowId}: ${existing.schedule} → ${newSchedule}`)
    
    return await this.scheduleWorkflow(workflowId, newSchedule, existing.graph)
  }

  // Clean up all schedules
  destroy() {
    console.log('🧹 Cleaning up advanced scheduler...')
    
    for (const [workflowId, scheduled] of this.schedules) {
      clearInterval(scheduled.interval)
    }
    
    this.schedules.clear()
    this.isInitialized = false
  }

  // Private methods
  private createExecuteCallback(workflowId: string, graph: any): () => Promise<void> {
    return async () => {
      const executionTime = new Date().toLocaleString()
      console.log(`🕒 Executing scheduled workflow: ${workflowId} at ${executionTime}`)
      
      try {
        // Dynamic import to avoid circular dependencies
        const { executionEngine } = await import('./executionEngine')
        await executionEngine.executeWorkflow(workflowId, graph)
        
        // Update execution count
        const scheduled = this.schedules.get(workflowId)
        if (scheduled) {
          scheduled.executionCount++
          scheduled.updatedAt = new Date()
          this.saveToStorage(scheduled)
        }
        
        console.log(`✅ Successfully executed workflow ${workflowId}`)
      } catch (error) {
        console.error(`❌ Error in scheduled execution of ${workflowId}:`, error)
      }
    }
  }

  private createInterval(workflowId: string, executeCallback: () => Promise<void>, intervalMs: number): NodeJS.Timeout {
    return setInterval(executeCallback, intervalMs)
  }

  private getIntervalMs(schedule: string): number {
    switch (schedule) {
      case 'every_minute':
        return 60000
      case 'every_5_minutes':
        return 300000
      case 'every_15_minutes':
        return 900000
      case 'hourly':
        return 3600000
      case 'daily':
        return 86400000
      case 'weekly':
        return 604800000
      case 'monthly':
        return 2629746000 // Approx 1 month
      default:
        const minutesMatch = schedule.match(/every_(\d+)_minutes/)
        if (minutesMatch) {
          return parseInt(minutesMatch[1]) * 60000
        }
        return 60000 
    }
  }

  private calculateNextExecution(schedule: string): Date {
    const now = new Date()
    const intervalMs = this.getIntervalMs(schedule)
    return new Date(now.getTime() + intervalMs)
  }

  // Storage methods
  private getStoredSchedules(): ScheduledWorkflow[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('advanced_workflow_schedules')
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      
      // Convert string dates back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        nextExecution: new Date(item.nextExecution),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }))
    } catch {
      return []
    }
  }

  private saveToStorage(scheduledWorkflow: ScheduledWorkflow) {
    if (typeof window === 'undefined') return
    
    const allSchedules = this.getStoredSchedules()
    const existingIndex = allSchedules.findIndex(s => s.workflowId === scheduledWorkflow.workflowId)
    
    if (existingIndex >= 0) {
      allSchedules[existingIndex] = scheduledWorkflow
    } else {
      allSchedules.push(scheduledWorkflow)
    }
    
    localStorage.setItem('advanced_workflow_schedules', JSON.stringify(allSchedules))
  }

  private markInactiveInStorage(workflowId: string) {
    const allSchedules = this.getStoredSchedules()
    const scheduleIndex = allSchedules.findIndex(s => s.workflowId === workflowId)
    
    if (scheduleIndex >= 0) {
      allSchedules[scheduleIndex].isActive = false
      allSchedules[scheduleIndex].updatedAt = new Date()
      localStorage.setItem('advanced_workflow_schedules', JSON.stringify(allSchedules))
    }
  }

  private restoreSchedule(storedSchedule: ScheduledWorkflow) {
    const executeCallback = this.createExecuteCallback(storedSchedule.workflowId, storedSchedule.graph)
    const intervalMs = this.getIntervalMs(storedSchedule.schedule)
    
    const scheduledWorkflow: ScheduledWorkflow = {
      ...storedSchedule,
      executeCallback,
      interval: this.createInterval(storedSchedule.workflowId, executeCallback, intervalMs),
      nextExecution: this.calculateNextExecution(storedSchedule.schedule)
    }

    this.schedules.set(storedSchedule.workflowId, scheduledWorkflow)
  }
}

export const advancedScheduler = new AdvancedClientScheduler()