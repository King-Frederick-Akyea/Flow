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
  private schedules: Map<string, ScheduledWorkflow> = new Map()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isInitialized = false
  private executionLocks: Map<string, boolean> = new Map()

  constructor() {
    if (typeof window !== "undefined") {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.initialize()
      })
    }
  }

  initialize() {
    if (this.isInitialized) return
    this.isInitialized = true

    console.log("🔄 Scheduler initializing…")

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
    
    // Debug output
    this.debugSchedules()
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)

    this.heartbeatTimer = setInterval(() => {
      this.checkDueWorkflows()
    }, 2000) // Check every 2 seconds

    console.log("❤️ Heartbeat started")
  }

  private async checkDueWorkflows() {
    const now = Date.now()
    let dueCount = 0

    for (const [id, workflow] of this.schedules) {
      if (!workflow.isActive) continue
      
      // Skip if currently executing
      if (this.executionLocks.get(id)) {
        continue
      }

      if (now >= workflow.nextExecution) {
        dueCount++
        console.log(`⚡ Workflow ${id} is DUE! Running now...`)
        console.log(`   Scheduled: ${new Date(workflow.nextExecution).toISOString()}`)
        console.log(`   Current: ${new Date(now).toISOString()}`)
        
        this.executionLocks.set(id, true)
        
        try {
          await this.runWorkflow(id)
          
          // Calculate next execution - FIXED: Use the original nextExecution as base
          const intervalMs = this.getIntervalMs(workflow.schedule)
          const newNextExecution = workflow.nextExecution + intervalMs
          
          workflow.nextExecution = newNextExecution
          workflow.updatedAt = Date.now()
          
          console.log(`✅ Workflow ${id} completed. Next run: ${new Date(workflow.nextExecution).toISOString()}`)
          
          this.saveAll()
        } catch (error) {
          console.error(`❌ Workflow ${id} failed:`, error)
          // On error, still schedule next execution but use current time as base
          const intervalMs = this.getIntervalMs(workflow.schedule)
          workflow.nextExecution = Date.now() + intervalMs
          this.saveAll()
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
      
      // Dynamic import to avoid circular dependencies
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
      return
    }

    wf.isActive = false
    wf.updatedAt = Date.now()
    this.executionLocks.delete(workflowId)

    this.saveAll()
    console.log(`🗑️ Unscheduled ${workflowId}`)
  }

  // DEBUG METHOD - Add this to see what's happening
  debugSchedules() {
    console.log("🔍 SCHEDULER DEBUG INFO:")
    console.log("Total schedules:", this.schedules.size)
    
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

  // Add this method to manually trigger the scheduler check
  forceCheck() {
    console.log("🔧 Manually triggering scheduler check")
    this.checkDueWorkflows()
  }

  private getIntervalMs(schedule: string) {
    const presets: Record<string, number> = {
      every_minute: 60 * 1000, // 1 minute
      every_5_minutes: 5 * 60 * 1000, // 5 minutes
      every_15_minutes: 15 * 60 * 1000, // 15 minutes
      hourly: 60 * 60 * 1000, // 1 hour
      daily: 24 * 60 * 60 * 1000, // 24 hours
    }

    if (presets[schedule]) {
      return presets[schedule]
    }

    const match = schedule.match(/every_(\d+)_minutes/)
    if (match) {
      return parseInt(match[1]) * 60 * 1000
    }

    console.warn(`⚠️ Unknown schedule: ${schedule}, defaulting to 1 minute`)
    return 60 * 1000 // Default to 1 minute
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

  // Cleanup
  destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.executionLocks.clear()
    console.log("🧹 Scheduler destroyed")
  }
}

export const advancedScheduler = new AdvancedClientScheduler()