// Simple scheduler for demo - in production use Redis/Cron
class SimpleScheduler {
  private schedules: Map<string, NodeJS.Timeout> = new Map()

  scheduleWorkflow(workflowId: string, schedule: string, executeCallback: () => void) {
    // Clear existing schedule
    this.unscheduleWorkflow(workflowId)

    let intervalMs = 60000; // Default: 1 minute
    
    switch (schedule) {
      case 'every_minute':
        intervalMs = 60000
        break
      case 'hourly':
        intervalMs = 3600000
        break
      case 'daily':
        intervalMs = 86400000
        break
      case 'weekly':
        intervalMs = 604800000
        break
      case 'monthly':
        intervalMs = 2629746000 // Approx 1 month
        break
      default:
        intervalMs = 60000
    }

    console.log(`Scheduling workflow ${workflowId} to run every ${intervalMs}ms`)
    
    const interval = setInterval(() => {
      console.log(`🕒 Executing scheduled workflow: ${workflowId}`)
      executeCallback()
    }, intervalMs)

    this.schedules.set(workflowId, interval)
  }

  unscheduleWorkflow(workflowId: string) {
    const existing = this.schedules.get(workflowId)
    if (existing) {
      clearInterval(existing)
      this.schedules.delete(workflowId)
    }
  }
}

export const scheduler = new SimpleScheduler()