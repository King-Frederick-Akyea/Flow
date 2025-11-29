'use client'

import React, { useState, useEffect } from 'react'
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'
import { WorkflowGraph } from '@/types/workflow'
import { executionEngine } from '@/lib/executionEngine'
import { advancedScheduler } from '@/lib/scheduler' // Adjust path as needed
import { Play, Save, Settings, Terminal, ChevronUp, ChevronDown, Trash2, Link, Zap } from 'lucide-react'

interface ExecutionPanelProps {
  selectedNode: ReactFlowNode | null
  selectedEdge?: ReactFlowEdge | null
  workflowId?: string
  onConfigUpdate: (nodeId: string, config: any) => void
  getCurrentGraph: () => WorkflowGraph
  onSave?: (graph: WorkflowGraph) => void
  name?: string
  description?: string
}

export function ExecutionPanel({ 
  selectedNode, 
  selectedEdge,
  workflowId, 
  onConfigUpdate, 
  getCurrentGraph,
  onSave,
  name,
  description
}: ExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [panelHeight, setPanelHeight] = useState(320)
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config')
  const [localConfig, setLocalConfig] = useState<any>({})

  // Update local config when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setLocalConfig(selectedNode.data.config || {})
    }
  }, [selectedNode])

  const handleExecute = async () => {
    if (!workflowId) {
      setExecutionLog(prev => [...prev, ' ❌ Error: Please save the workflow first before executing'])
      alert('Please save the workflow first before executing')
      return
    }

    setIsExecuting(true)
    setActiveTab('logs')
    setExecutionLog([' 🚀 Starting workflow execution...'])

    try {
      const graph = getCurrentGraph()
      
      // FIRST: Save the workflow (this is important)
      onSave?.(graph)
      
      // SECOND: Find the trigger node to get the schedule
      const triggerNode = graph.nodes.find(node => node.type === 'trigger')
      
      if (triggerNode && triggerNode.data.config?.schedule) {
        const schedule = triggerNode.data.config.schedule
        setExecutionLog(prev => [...prev, ` 📅 Scheduling workflow with: ${schedule}`])
        
        // Schedule the workflow with the scheduler
        await advancedScheduler.scheduleWorkflow(workflowId, schedule, graph)
        
        setExecutionLog(prev => [...prev, 
          ' ✅ Workflow scheduled successfully!', 
          ` 🕒 It will run automatically every ${schedule.replace('_', ' ')}`,
          ' 💡 Use "Run Once" to test immediately'
        ])
      } else {
        // If no schedule, just run once
        setExecutionLog(prev => [...prev, ' ⚠️ No schedule found, running once...'])
        const result = await executionEngine.executeWorkflow(workflowId, graph)
        setExecutionLog(prev => [...prev, ...result.logs])
      }
    } catch (error: any) {
      setExecutionLog(prev => [...prev, ` ❌ Execution failed: ${error.message}`])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleTriggerNow = async () => {
    if (!workflowId) {
      setExecutionLog(prev => [...prev, ' ❌ Error: Please save the workflow first'])
      alert('Please save the workflow first')
      return
    }

    setIsExecuting(true)
    setActiveTab('logs')
    setExecutionLog([' 🚀 Manually triggering workflow...'])

    try {
      const graph = getCurrentGraph()
      const result = await executionEngine.executeWorkflow(workflowId, graph)
      setExecutionLog(prev => [...prev, ...result.logs, ' ✅ Manual execution completed!'])
    } catch (error: any) {
      setExecutionLog(prev => [...prev, ` ❌ Manual execution failed: ${error.message}`])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSave = () => {
    const graph = getCurrentGraph()
    onSave?.(graph)
    
    // Auto-schedule if there's a trigger with schedule
    if (workflowId) {
      const triggerNode = graph.nodes.find(node => node.type === 'trigger')
      if (triggerNode && triggerNode.data.config?.schedule) {
        const schedule = triggerNode.data.config.schedule
        setExecutionLog(prev => [...prev, ` ⏰ Auto-scheduling workflow with: ${schedule}`])
        advancedScheduler.scheduleWorkflow(workflowId, schedule, graph)
      }
    }
    
    setExecutionLog(prev => [...prev, ' 💾 Workflow saved successfully'])
  }

  const handleDebugScheduler = () => {
    setExecutionLog(prev => [...prev, ' 🔍 Checking scheduler status...'])
    advancedScheduler.debugSchedules()
  }

  const handleForceCheck = () => {
    setExecutionLog(prev => [...prev, ' 🔧 Manually triggering scheduler check...'])
    advancedScheduler.forceCheck()
  }

  const handleConfigChange = (field: string, value: any) => {
    if (!selectedNode) return;
    
    const updatedConfig = {
      ...localConfig,
      [field]: value
    };
    
    setLocalConfig(updatedConfig);
    onConfigUpdate(selectedNode.id, updatedConfig);
  }

  // Add this function to handle input events properly
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    handleConfigChange(field, e.target.value);
  }

  const renderConnectionInfo = () => {
    if (!selectedEdge) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
          <Link className="w-12 h-12 mb-4 text-slate-400" />
          <p className="text-lg font-medium mb-2">No Connection Selected</p>
          <p className="text-sm text-center">Click on a connection between nodes to view details</p>
        </div>
      )
    }

    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Link className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Connection</h3>
            <p className="text-sm text-slate-600">Data flow between nodes</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">Connection Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">From:</span>
                <span className="font-medium text-slate-900">
                  {selectedEdge.source}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">To:</span>
                <span className="font-medium text-slate-900">
                  {selectedEdge.target}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderNodeConfig = () => {
    if (!selectedNode) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
          <Settings className="w-12 h-12 mb-4 text-slate-400" />
          <p className="text-lg font-medium mb-2">No Node Selected</p>
          <p className="text-sm text-center">Click on a node to configure its settings</p>
        </div>
      )
    }

    return (
      <div key={selectedNode.id} className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Configure {selectedNode.data.label}</h3>
            <p className="text-sm text-slate-600">Adjust the settings for this node</p>
          </div>
        </div>
        {renderConfigForm(selectedNode)}
      </div>
    )
  }

  const renderConfigForm = (node: ReactFlowNode) => {
    const nodeData = node.data

    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Schedule Type
              </label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={localConfig.schedule || ''}
                onChange={handleInputChange('schedule')}
              >
                <option value="every_minute">Every Minute</option>
                <option value="every_5_minutes">Every 5 Minutes</option>
                <option value="every_15_minutes">Every 15 Minutes</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily (9 AM)</option>
              </select>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Schedule Note:</strong> After setting the schedule, click "Save" to enable automatic execution.
              </p>
            </div>
          </div>
        )
      
      case 'dataSource':
        switch (localConfig.source) {
          case 'weather':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter city name"
                    value={localConfig.city || ''}
                    onChange={handleInputChange('city')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country Code (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="UK"
                    value={localConfig.country || ''}
                    onChange={handleInputChange('country')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Units
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.units || 'metric'}
                    onChange={handleInputChange('units')}
                  >
                    <option value="metric">Celsius</option>
                    <option value="imperial">Fahrenheit</option>
                  </select>
                </div>
              </div>
            )
          
          case 'github':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Repository
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="owner/repository"
                    value={localConfig.repository || ''}
                    onChange={handleInputChange('repository')}
                  />
                </div>
              </div>
            )
          
          default:
            return (
              <div className="text-slate-500 text-center py-8">
                Configuration for {localConfig.source} data source
              </div>
            )
        }
      
      case 'action':
        switch (localConfig.action) {
          case 'email':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    To Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="recipient@example.com"
                    value={localConfig.to || ''}
                    onChange={handleInputChange('to')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Weather Update"
                    value={localConfig.subject || ''}
                    onChange={handleInputChange('subject')}
                  />
                </div>
              </div>
            )
          
          case 'slack':
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="https://hooks.slack.com/services/..."
                    value={localConfig.webhookUrl || ''}
                    onChange={handleInputChange('webhookUrl')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Workflow executed successfully!"
                    rows={3}
                    value={localConfig.message || ''}
                    onChange={handleInputChange('message')}
                  />
                </div>
              </div>
            )
          
          default:
            return (
              <div className="text-slate-500 text-center py-8">
                Configuration for {localConfig.action} action
              </div>
            )
        }

      case 'logic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Condition
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="temperature > 20"
                value={localConfig.condition || ''}
                onChange={handleInputChange('condition')}
              />
              <p className="text-xs text-slate-500 mt-2">
                Examples: <code>temperature {'>'} 20</code>, <code>condition === 'Rain'</code>
              </p>
            </div>
          </div>
        )

      case 'transform':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Transform weather data for email"
                value={localConfig.description || ''}
                onChange={handleInputChange('description')}
              />
            </div>
          </div>
        )

      case 'ai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prompt
              </label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Process the weather data and create a friendly summary..."
                rows={4}
                value={localConfig.prompt || ''}
                onChange={handleInputChange('prompt')}
              />
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-slate-500 text-center py-8">
            No configuration available for this node type.
          </div>
        )
    }
  }

  const renderLogs = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-slate-50 rounded-lg">
        {executionLog.length === 0 ? (
          <div className="text-slate-500 flex flex-col items-center justify-center h-full">
            <Terminal className="w-12 h-12 mb-4 text-slate-400" />
            <p>Execution logs will appear here...</p>
          </div>
        ) : (
          executionLog.map((log, index) => (
            <div key={index} className="mb-2 py-1 px-2 rounded hover:bg-slate-100 transition-colors">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div 
      className="bg-white border-t border-slate-200 flex flex-col transition-all duration-300"
      style={{ height: `${panelHeight}px` }}
    >
      <div 
        className="h-4 bg-slate-50 border-b border-slate-200 cursor-row-resize flex items-center justify-center group"
        onMouseDown={(e) => {
          e.preventDefault()
          const startY = e.clientY
          const startHeight = panelHeight

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = startY - moveEvent.clientY
            const newHeight = Math.max(200, Math.min(600, startHeight + delta))
            setPanelHeight(newHeight)
          }

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }

          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      >
        <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
      </div>

      <div className="flex-1 flex">
        {/* Configuration Panel */}
        <div className="w-1/2 border-r border-slate-200 flex flex-col">
          <div className="border-b border-slate-200 p-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'config' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuration</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'logs' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Execution Logs</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'config' ? (
              selectedEdge ? renderConnectionInfo() : renderNodeConfig()
            ) : renderLogs()}
          </div>
        </div>

        {/* Execution Controls */}
        <div className="w-1/2 flex flex-col">
          <div className="border-b border-slate-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Workflow Controls</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {workflowId ? 'Save to schedule or trigger manually' : 'Save your workflow first'}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                
                <button
                  onClick={handleTriggerNow}
                  disabled={isExecuting || !workflowId}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>{isExecuting ? 'Running...' : 'Run Once'}</span>
                </button>
                
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !workflowId}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isExecuting ? 'Scheduling...' : 'Schedule'}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Workflow Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-medium text-slate-900">
                      {workflowId ? 'Saved' : 'Unsaved'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nodes:</span>
                    <span className="font-medium text-slate-900">
                      {getCurrentGraph().nodes.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Connections:</span>
                    <span className="font-medium text-slate-900">
                      {getCurrentGraph().edges.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Scheduler Controls</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleDebugScheduler}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <span>Debug Scheduler</span>
                  </button>
                  <button
                    onClick={handleForceCheck}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    <span>Force Check Now</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Show current schedule info */}
            {workflowId && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Schedule Info</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Workflow ID:</strong> {workflowId}</p>
                  <p><strong>Instructions:</strong></p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Set schedule in trigger node configuration</li>
                    <li>Click "Save" to auto-schedule</li>
                    <li>Use "Run Once" to test immediately</li>
                    <li>Use "Schedule" to enable automatic execution</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}