// Simple in-memory scheduler for demo purposes
// In production, you'd use Redis with BullMQ or similar

interface ScheduledJob {
  id: string
  workflowId: string
  cron: string
  lastRun: Date | null
  nextRun: Date
  enabled: boolean
}

class SimpleScheduler {
  private jobs: Map<string, ScheduledJob> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  scheduleWorkflow(workflowId: string, cron: string) {
    const jobId = `job-${workflowId}`
    
    // Parse cron (simple implementation for demo)
    const nextRun = this.calculateNextRun(cron)
    
    const job: ScheduledJob = {
      id: jobId,
      workflowId,
      cron,
      lastRun: null,
      nextRun,
      enabled: true
    }
    
    this.jobs.set(jobId, job)
    
    // Set up interval based on cron
    const interval = this.setupExecution(workflowId, cron)
    this.intervals.set(jobId, interval)
    
    console.log(`Scheduled workflow ${workflowId} with cron: ${cron}`)
    return jobId
  }

  unscheduleWorkflow(workflowId: string) {
    const jobId = `job-${workflowId}`
    const interval = this.intervals.get(jobId)
    
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(jobId)
    }
    
    this.jobs.delete(jobId)
    console.log(`Unscheduled workflow ${workflowId}`)
  }

  private setupExecution(workflowId: string, cron: string): NodeJS.Timeout {
    // Simple implementation - in production, use proper cron parsing
    const interval = cron === 'every_minute' ? 60000 : 
                   cron === 'hourly' ? 3600000 :
                   cron === 'daily' ? 86400000 : 60000 // Default to 1 minute
    
    return setInterval(async () => {
      console.log(`Executing scheduled workflow: ${workflowId}`)
      // Here you would trigger the workflow execution
      // await executeWorkflow(workflowId)
    }, interval)
  }

  private calculateNextRun(cron: string): Date {
    const now = new Date()
    
    switch (cron) {
      case 'every_minute':
        return new Date(now.getTime() + 60000)
      case 'hourly':
        return new Date(now.getTime() + 3600000)
      case 'daily':
        return new Date(now.getTime() + 86400000)
      default:
        return new Date(now.getTime() + 60000)
    }
  }

  getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values())
  }
}

export const scheduler = new SimpleScheduler()