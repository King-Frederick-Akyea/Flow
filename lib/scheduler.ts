'use client'

interface ScheduledWorkflow {
  workflowId: string
  schedule: string
  graph: any
  lastExecution: number
  nextExecution: number
  isActive: boolean
  executionCount: number
  createdAt: number
  updatedAt: number
}

class AdvancedClientScheduler {
  private static instance: AdvancedClientScheduler
  private schedules: Map<string, ScheduledWorkflow> = new Map()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isInitialized = false
  private executionLocks: Map<string, boolean> = new Map()

  // Singleton pattern to prevent multiple instances
  public static getInstance(): AdvancedClientScheduler {
    if (!AdvancedClientScheduler.instance) {
      AdvancedClientScheduler.instance = new AdvancedClientScheduler()
    }
    return AdvancedClientScheduler.instance
  }

  private constructor() {
    if (typeof window !== "undefined") {
      // Clean up any existing instances and timers
      this.destroy()
      
      requestAnimationFrame(() => {
        this.initialize()
      })
    }
  }

  initialize() {
    if (this.isInitialized) return
    this.isInitialized = true

    console.log("🔄 Scheduler initializing…")

    // Clear any existing data first
    this.schedules.clear()
    this.executionLocks.clear()

    const stored = this.getStoredSchedules()
    console.log("📦 Found stored schedules:", stored.length)

    stored.forEach(s => {
      if (s.isActive) {
        // Ensure nextExecution is in the future
        if (s.nextExecution <= Date.now()) {
          const intervalMs = this.getIntervalMs(s.schedule)
          s.nextExecution = Date.now() + intervalMs
          console.log(`🕒 Reset next execution for ${s.workflowId} to ${new Date(s.nextExecution).toISOString()}`)
        }
        this.schedules.set(s.workflowId, s)
        console.log(`✅ Loaded workflow: ${s.workflowId} (active)`)
      } else {
        console.log(`❌ Skipped workflow: ${s.workflowId} (inactive)`)
      }
    })

    this.startHeartbeat()
    console.log("✅ Scheduler ready with", this.schedules.size, "active workflows")
    
    this.debugSchedules()
  }

  private startHeartbeat() {
    // Clear any existing timer first
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    this.heartbeatTimer = setInterval(() => {
      this.checkDueWorkflows()
    }, 2000)

    console.log("❤️ Heartbeat started")
  }

  private async checkDueWorkflows() {
    const now = Date.now()
    let dueCount = 0

    // Create a copy to avoid modification during iteration
    const schedules = Array.from(this.schedules.entries())
    
    for (const [id, workflow] of schedules) {
      // Double-check if workflow still exists and is active
      const currentWorkflow = this.schedules.get(id)
      if (!currentWorkflow || !currentWorkflow.isActive) {
        continue
      }
      
      // Skip if currently executing
      if (this.executionLocks.get(id)) {
        continue
      }

      if (now >= workflow.nextExecution) {
        dueCount++
        console.log(`⚡ Workflow ${id} is DUE! Running now...`)
        
        this.executionLocks.set(id, true)
        
        try {
          await this.runWorkflow(id)
          
          // Only update if workflow still exists and is active
          const updatedWorkflow = this.schedules.get(id)
          if (updatedWorkflow && updatedWorkflow.isActive) {
            const intervalMs = this.getIntervalMs(workflow.schedule)
            updatedWorkflow.nextExecution = workflow.nextExecution + intervalMs
            updatedWorkflow.updatedAt = Date.now()
            
            console.log(`✅ Workflow ${id} completed. Next run: ${new Date(updatedWorkflow.nextExecution).toISOString()}`)
          }
          
          this.saveAll()
        } catch (error) {
          console.error(`❌ Workflow ${id} failed:`, error)
          // Only reschedule if workflow still exists and active
          const failedWorkflow = this.schedules.get(id)
          if (failedWorkflow && failedWorkflow.isActive) {
            const intervalMs = this.getIntervalMs(workflow.schedule)
            failedWorkflow.nextExecution = Date.now() + intervalMs
            this.saveAll()
          }
        } finally {
          this.executionLocks.set(id, false)
        }
      }
    }
    
    if (dueCount > 0) {
      console.log(`🎯 Processed ${dueCount} due workflows`)
    }
  }

  async scheduleWorkflow(workflowId: string, schedule: string, graph: any) {
    console.log(`📅 Scheduling workflow: ${workflowId} with schedule: ${schedule}`)
    
    const intervalMs = this.getIntervalMs(schedule)
    const now = Date.now()

    const wf: ScheduledWorkflow = {
      workflowId,
      schedule,
      graph,
      lastExecution: 0,
      nextExecution: now + intervalMs,
      isActive: true,
      executionCount: 0,
      createdAt: now,
      updatedAt: now
    }

    this.schedules.set(workflowId, wf)
    this.saveAll()

    console.log(`✅ Scheduled workflow ${workflowId}`)
    console.log(`   First run: ${new Date(wf.nextExecution).toISOString()}`)
    console.log(`   Interval: ${schedule} (${intervalMs}ms)`)
    
    this.debugSchedules()
  }

  private async runWorkflow(workflowId: string) {
    const workflow = this.schedules.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found in scheduler`)
    }

    try {
      console.log(`🏃 Executing workflow: ${workflowId}`)
      
      // Use a static import to avoid HMR issues
      const { executionEngine } = await import('./executionEngine')
      const result = await executionEngine.executeWorkflow(workflowId, workflow.graph)

      workflow.lastExecution = Date.now()
      workflow.executionCount++
      workflow.updatedAt = Date.now()

      console.log(`✅ Successfully executed workflow ${workflowId} (run #${workflow.executionCount})`)
      return result
    } catch (error) {
      console.error(`❌ Workflow execution failed:`, error)
      throw error
    }
  }

  unscheduleWorkflow(workflowId: string) {
    const wf = this.schedules.get(workflowId)
    if (!wf) {
      console.log(`⚠️ Workflow ${workflowId} not found for unscheduling`)
      return false
    }

    // COMPLETELY REMOVE from all tracking
    this.schedules.delete(workflowId)
    this.executionLocks.delete(workflowId)

    this.saveAll()
    console.log(`🗑️ Completely unscheduled and removed ${workflowId}`)
    
    this.debugSchedules()
    return true
  }

  // COMPLETELY CLEAR EVERYTHING - Use this to stop all schedules
  clearAllSchedules() {
    console.log("🧨 NUKING ALL SCHEDULES AND CLEARING CACHE")
    
    // Stop the heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    // Clear all data
    this.schedules.clear()
    this.executionLocks.clear()
    
    // Clear localStorage
    localStorage.removeItem("advanced_schedules")
    
    console.log("✅ All schedules cleared from memory and localStorage")
    this.debugSchedules()
  }

  // Stop scheduling but keep workflows in memory (for saving)
  stopAllSchedules() {
    console.log("🛑 Stopping all scheduled workflows")
    
    const workflowIds = Array.from(this.schedules.keys())
    workflowIds.forEach(workflowId => {
      this.unscheduleWorkflow(workflowId)
    })
    
    console.log("✅ All workflows have been stopped")
  }

  // DEBUG METHOD
  debugSchedules() {
    console.log("🔍 SCHEDULER DEBUG INFO:")
    console.log("Total schedules:", this.schedules.size)
    console.log("Execution locks:", this.executionLocks.size)
    console.log("Heartbeat running:", this.heartbeatTimer !== null)
    
    if (this.schedules.size === 0) {
      console.log("❌ No workflows scheduled!")
      return
    }
    
    for (const [id, workflow] of this.schedules) {
      const status = workflow.isActive ? 'ACTIVE' : 'INACTIVE'
      const nextRun = new Date(workflow.nextExecution).toISOString()
      const lastRun = workflow.lastExecution ? new Date(workflow.lastExecution).toISOString() : 'Never'
      const timeUntilNext = workflow.nextExecution - Date.now()
      
      console.log(`📋 ${id}:`)
      console.log(`   Status: ${status}`)
      console.log(`   Schedule: ${workflow.schedule}`)
      console.log(`   Next Run: ${nextRun} (in ${Math.round(timeUntilNext/1000)}s)`)
      console.log(`   Last Run: ${lastRun}`)
      console.log(`   Execution Count: ${workflow.executionCount}`)
      console.log(`   Is Locked: ${this.executionLocks.get(id) || false}`)
    }
  }

  forceCheck() {
    console.log("🔧 Manually triggering scheduler check")
    this.checkDueWorkflows()
  }

  isWorkflowScheduled(workflowId: string): boolean {
    return this.schedules.has(workflowId) && this.schedules.get(workflowId)!.isActive
  }

  getWorkflowStatus(workflowId: string) {
    const workflow = this.schedules.get(workflowId)
    if (!workflow) return null

    return {
      ...workflow,
      isExecuting: this.executionLocks.get(workflowId) || false,
      nextExecutionFormatted: new Date(workflow.nextExecution).toISOString(),
      timeUntilNext: workflow.nextExecution - Date.now()
    }
  }

  getScheduledWorkflowIds(): string[] {
    return Array.from(this.schedules.keys())
  }

  private getIntervalMs(schedule: string) {
    const presets: Record<string, number> = {
      every_minute: 60 * 1000,
      every_5_minutes: 5 * 60 * 1000,
      every_15_minutes: 15 * 60 * 1000,
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
    }

    if (presets[schedule]) {
      return presets[schedule]
    }

    const match = schedule.match(/every_(\d+)_minutes/)
    if (match) {
      return parseInt(match[1]) * 60 * 1000
    }

    console.warn(`⚠️ Unknown schedule: ${schedule}, defaulting to 1 minute`)
    return 60 * 1000
  }

  private getStoredSchedules(): ScheduledWorkflow[] {
    try {
      const raw = localStorage.getItem("advanced_schedules")
      if (!raw) {
        console.log("💾 No stored schedules found in localStorage")
        return []
      }
      const schedules = JSON.parse(raw)
      console.log(`💾 Loaded ${schedules.length} schedules from localStorage`)
      return schedules
    } catch (error) {
      console.error("❌ Failed to load schedules from localStorage:", error)
      return []
    }
  }

  private saveAll() {
    try {
      const schedules = [...this.schedules.values()]
      localStorage.setItem("advanced_schedules", JSON.stringify(schedules))
      console.log(`💾 Saved ${schedules.length} schedules to localStorage`)
    } catch (error) {
      console.error("❌ Failed to save schedules:", error)
    }
  }

  // Cleanup - call this when your component unmounts
  destroy() {
    console.log("🧹 Destroying scheduler instance")
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.executionLocks.clear()
    // Don't clear schedules here, just stop the timer
  }
}

// Export singleton instance
export const advancedScheduler = AdvancedClientScheduler.getInstance()