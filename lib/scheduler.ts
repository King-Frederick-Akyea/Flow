interface ScheduledWorkflow {
  workflowId: string
  executeCallback: () => void
  interval: NodeJS.Timeout
  nextExecution: Date
  schedule: string
}

class AdvancedScheduler {
  private schedules: Map<string, ScheduledWorkflow> = new Map()

  scheduleWorkflow(workflowId: string, schedule: string, executeCallback: () => void) {
    // Clear existing schedule
    this.unscheduleWorkflow(workflowId)

    let intervalMs: number
    let nextExecution: Date

    const now = new Date()
    
    switch (schedule) {
      case 'every_minute':
        intervalMs = 60000
        nextExecution = new Date(now.getTime() + intervalMs)
        break
        
      case 'hourly':
        intervalMs = 3600000
        nextExecution = new Date(now.getTime() + intervalMs)
        break
        
      case 'daily':
        // Schedule for same time tomorrow
        intervalMs = 86400000
        nextExecution = new Date(now)
        nextExecution.setDate(nextExecution.getDate() + 1)
        break
        
      case 'weekly':
        intervalMs = 604800000
        nextExecution = new Date(now)
        nextExecution.setDate(nextExecution.getDate() + 7)
        break
        
      case 'monthly':
        intervalMs = 2629746000 // Approx 1 month
        nextExecution = new Date(now)
        nextExecution.setMonth(nextExecution.getMonth() + 1)
        break
        
      default:
        intervalMs = 60000
        nextExecution = new Date(now.getTime() + intervalMs)
    }

    console.log(`📅 Scheduling workflow ${workflowId} to run ${schedule} (next: ${nextExecution.toLocaleString()})`)
    
    const interval = setInterval(() => {
      const executionTime = new Date().toLocaleString()
      console.log(`🕒 Executing scheduled workflow: ${workflowId} at ${executionTime}`)
      executeCallback()
      
      // Update next execution time
      const scheduledWorkflow = this.schedules.get(workflowId)
      if (scheduledWorkflow) {
        scheduledWorkflow.nextExecution = new Date(Date.now() + intervalMs)
      }
    }, intervalMs)

    this.schedules.set(workflowId, {
      workflowId,
      executeCallback,
      interval,
      nextExecution,
      schedule
    })
  }

  unscheduleWorkflow(workflowId: string) {
    const existing = this.schedules.get(workflowId)
    if (existing) {
      clearInterval(existing.interval)
      this.schedules.delete(workflowId)
      console.log(`🗑️ Unscheduled workflow: ${workflowId}`)
    }
  }

  getScheduledWorkflows(): ScheduledWorkflow[] {
    return Array.from(this.schedules.values())
  }

  getNextExecution(workflowId: string): Date | null {
    const scheduled = this.schedules.get(workflowId)
    return scheduled ? scheduled.nextExecution : null
  }
}

export const scheduler = new AdvancedScheduler()