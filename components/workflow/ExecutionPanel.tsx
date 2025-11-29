'use client'

import React, { useState, useEffect } from 'react'
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'
import { WorkflowGraph } from '@/types/workflow'
import { executionEngine } from '@/lib/executionEngine'
import { advancedScheduler } from '@/lib/scheduler'
import { Play, Save, Settings, Terminal, ChevronUp, ChevronDown, Trash2, Link, Zap, StopCircle } from 'lucide-react'

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
          ` 🕒 It will run automatically every ${schedule.replace(/_/g, ' ')}`,
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
    setExecutionLog(prev => [...prev, ' 💾 Workflow saved successfully'])
  }

  const handleStopScheduling = () => {
    if (!workflowId) {
      setExecutionLog(prev => [...prev, ' ❌ Error: No workflow ID found'])
      return
    }

    // Option 1: Stop just this workflow
    const stopped = advancedScheduler.unscheduleWorkflow(workflowId)
    if (stopped) {
      setExecutionLog(prev => [...prev, ' 🛑 Workflow scheduling stopped'])
    } else {
      setExecutionLog(prev => [...prev, ' ⚠️ Workflow was not scheduled'])
    }
  }

  // Add a nuclear option to clear everything:
  const handleClearAllSchedules = () => {
    if (confirm('Are you sure you want to stop ALL scheduled workflows and clear the cache?')) {
      advancedScheduler.clearAllSchedules()
      setExecutionLog(prev => [...prev, ' 💥 All schedules cleared and cache reset'])
    }
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

  const handleCheckboxChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleConfigChange(field, e.target.checked);
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
                Trigger Type
              </label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={localConfig.triggerType || 'schedule'}
                onChange={handleInputChange('triggerType')}
              >
                <option value="schedule">Schedule</option>
                <option value="webhook">Webhook</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {localConfig.triggerType === 'schedule' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Schedule Type
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.schedule || 'every_minute'}
                    onChange={handleInputChange('schedule')}
                  >
                    <option value="every_minute">Every Minute</option>
                    <option value="every_5_minutes">Every 5 Minutes</option>
                    <option value="every_15_minutes">Every 15 Minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily (9 AM)</option>
                    <option value="weekly">Weekly (Monday 9 AM)</option>
                    <option value="monthly">Monthly (1st 9 AM)</option>
                  </select>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Schedule Note:</strong> Click "Schedule" button to enable automatic execution.
                  </p>
                </div>
              </>
            )}

            {localConfig.triggerType === 'webhook' && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  🌐 <strong>Webhook URL:</strong> Your webhook endpoint will be available after saving the workflow.
                </p>
              </div>
            )}

            {localConfig.triggerType === 'manual' && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  👆 <strong>Manual Trigger:</strong> This workflow can only be triggered manually using the "Run Once" button.
                </p>
              </div>
            )}
          </div>
        )
      
      case 'dataSource':
        // First, show source selection if not set
        if (!localConfig.source) {
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data Source
                </label>
                <select 
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={localConfig.source || ''}
                  onChange={handleInputChange('source')}
                >
                  <option value="">Select a data source</option>
                  <option value="weather">Weather</option>
                  <option value="github">GitHub</option>
                  <option value="http">HTTP Request</option>
                  <option value="database">Database</option>
                </select>
              </div>
            </div>
          )
        }

        switch (localConfig.source) {
          case 'weather':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    Weather Data Source
                  </label>
                  <button
                    onClick={() => handleConfigChange('source', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change source
                  </button>
                </div>
                
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
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    GitHub Data Source
                  </label>
                  <button
                    onClick={() => handleConfigChange('source', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change source
                  </button>
                </div>

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
                  <p className="text-xs text-slate-500 mt-1">Format: username/repository-name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Action
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.action || 'get_repo'}
                    onChange={handleInputChange('action')}
                  >
                    <option value="get_repo">Get Repository Info</option>
                    <option value="get_issues">Get Open Issues</option>
                    <option value="get_pulls">Get Open Pull Requests</option>
                    <option value="get_commits">Get Recent Commits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    GitHub Token (Optional)
                  </label>
                  <input
                    type="password"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="ghp_xxxxxxxx"
                    value={localConfig.token || ''}
                    onChange={handleInputChange('token')}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave empty to use environment token</p>
                </div>
              </div>
            )
          
          case 'http':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    HTTP Request
                  </label>
                  <button
                    onClick={() => handleConfigChange('source', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change source
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="https://api.example.com/data"
                    value={localConfig.url || ''}
                    onChange={handleInputChange('url')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Method
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.method || 'GET'}
                    onChange={handleInputChange('method')}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Headers (JSON)
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    rows={3}
                    value={localConfig.headers ? JSON.stringify(localConfig.headers, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const headers = e.target.value ? JSON.parse(e.target.value) : {};
                        handleConfigChange('headers', headers);
                      } catch (error) {
                        // Keep the invalid JSON for user to fix
                        handleConfigChange('headers', e.target.value);
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter headers as JSON object</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Body (JSON)
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                    placeholder='{"key": "value"}'
                    rows={3}
                    value={localConfig.body ? JSON.stringify(localConfig.body, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const body = e.target.value ? JSON.parse(e.target.value) : {};
                        handleConfigChange('body', body);
                      } catch (error) {
                        handleConfigChange('body', e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
            )
          
          case 'database':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    Database Query
                  </label>
                  <button
                    onClick={() => handleConfigChange('source', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change source
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Query
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                    placeholder="SELECT * FROM users WHERE status = 'active'"
                    rows={4}
                    value={localConfig.query || ''}
                    onChange={handleInputChange('query')}
                  />
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    ⚠️ <strong>Note:</strong> Database connections require server-side setup with proper environment variables.
                  </p>
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
        // First, show action selection if not set
        if (!localConfig.action) {
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Action Type
                </label>
                <select 
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={localConfig.action || ''}
                  onChange={handleInputChange('action')}
                >
                  <option value="">Select an action</option>
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="webhook">Webhook</option>
                  <option value="sms">SMS</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
            </div>
          )
        }

        switch (localConfig.action) {
          case 'email':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    Email Action
                  </label>
                  <button
                    onClick={() => handleConfigChange('action', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change action
                  </button>
                </div>

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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Custom Body (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Leave empty to use auto-generated content based on previous data"
                    rows={3}
                    value={localConfig.body || ''}
                    onChange={handleInputChange('body')}
                  />
                </div>
              </div>
            )
          
          case 'slack':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    Slack Action
                  </label>
                  <button
                    onClick={() => handleConfigChange('action', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change action
                  </button>
                </div>

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
                    Channel (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="#general"
                    value={localConfig.channel || ''}
                    onChange={handleInputChange('channel')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Workflow executed successfully! You can use {{variable}} syntax."
                    rows={3}
                    value={localConfig.message || ''}
                    onChange={handleInputChange('message')}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use <code>{'{{variable}}'}</code> to insert data from previous nodes
                  </p>
                </div>
              </div>
            )
          
          case 'webhook':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    Webhook Action
                  </label>
                  <button
                    onClick={() => handleConfigChange('action', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change action
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="https://api.example.com/webhook"
                    value={localConfig.url || ''}
                    onChange={handleInputChange('url')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Method
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.method || 'POST'}
                    onChange={handleInputChange('method')}
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Send Previous Data
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.sendData !== false ? 'true' : 'false'}
                    onChange={(e) => handleConfigChange('sendData', e.target.value === 'true')}
                  >
                    <option value="true">Yes - Send all previous node data</option>
                    <option value="false">No - Send custom payload only</option>
                  </select>
                </div>

                {localConfig.sendData === false && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Custom Payload (JSON)
                    </label>
                    <textarea
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                      placeholder='{"message": "Workflow executed"}'
                      rows={3}
                      value={localConfig.payload ? JSON.stringify(localConfig.payload, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const payload = e.target.value ? JSON.parse(e.target.value) : {};
                          handleConfigChange('payload', payload);
                        } catch (error) {
                          handleConfigChange('payload', e.target.value);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )
          
          case 'sms':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    SMS Action
                  </label>
                  <button
                    onClick={() => handleConfigChange('action', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change action
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+1234567890"
                    value={localConfig.phoneNumber || ''}
                    onChange={handleInputChange('phoneNumber')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Workflow notification: {{variable}}"
                    rows={3}
                    value={localConfig.message || ''}
                    onChange={handleInputChange('message')}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use <code>{'{{variable}}'}</code> to insert data from previous nodes
                  </p>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    📱 <strong>Twilio Required:</strong> Make sure Twilio credentials are configured in environment variables.
                  </p>
                </div>
              </div>
            )
          
          case 'notification':
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">
                    Notification Action
                  </label>
                  <button
                    onClick={() => handleConfigChange('action', '')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change action
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Workflow Update"
                    value={localConfig.title || ''}
                    onChange={handleInputChange('title')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your workflow has been executed successfully"
                    rows={3}
                    value={localConfig.message || ''}
                    onChange={handleInputChange('message')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notification Type
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={localConfig.type || 'info'}
                    onChange={handleInputChange('type')}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Browser Notification:</strong> This will show a browser notification when the workflow runs.
                  </p>
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
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                placeholder="data.temperature > 20 && data.condition === 'Clear'"
                value={localConfig.condition || ''}
                onChange={handleInputChange('condition')}
              />
              <p className="text-xs text-slate-500 mt-2">
                Examples: 
                <code> data.temperature {'>'} 20 </code>, 
                <code> data.condition === 'Rain' </code>,
                <code> data.stars {'>'} 100 </code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Operator
              </label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={localConfig.operator || 'AND'}
                onChange={handleInputChange('operator')}
              >
                <option value="AND">AND - All conditions must be true</option>
                <option value="OR">OR - Any condition can be true</option>
              </select>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                🔍 <strong>Data Access:</strong> Use <code>data.variableName</code> to access data from previous nodes.
              </p>
            </div>
          </div>
        )

      case 'transform':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transform Type
              </label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={localConfig.transformType || 'mapping'}
                onChange={handleInputChange('transformType')}
              >
                <option value="mapping">Field Mapping</option>
                <option value="filter">Data Filtering</option>
                <option value="format">Format Conversion</option>
              </select>
            </div>

            {localConfig.transformType === 'mapping' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Field Mapping (JSON)
                </label>
                <textarea
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                  placeholder={`{
  "summary": "Weather in $.city is $.condition",
  "currentTemp": "$.temperature",
  "isWarm": "$.temperature > 20"
}`}
                  rows={6}
                  value={localConfig.mapping ? JSON.stringify(localConfig.mapping, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const mapping = e.target.value ? JSON.parse(e.target.value) : {};
                      handleConfigChange('mapping', mapping);
                    } catch (error) {
                      handleConfigChange('mapping', e.target.value);
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use <code>$.</code> to reference fields from previous data. Example: <code>"summary": "Weather in $.city"</code>
                </p>
              </div>
            )}

            {localConfig.transformType === 'filter' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter Condition
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                  placeholder="item.temperature > 20"
                  value={localConfig.filterCondition || ''}
                  onChange={handleInputChange('filterCondition')}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use <code>item</code> to reference each item when filtering arrays.
                </p>
              </div>
            )}

            {localConfig.transformType === 'format' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Output Format
                </label>
                <select 
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={localConfig.outputFormat || 'json'}
                  onChange={handleInputChange('outputFormat')}
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="csv">CSV</option>
                  <option value="text">Plain Text</option>
                </select>
              </div>
            )}
          </div>
        )

      case 'ai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                AI Action
              </label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={localConfig.aiAction || 'process'}
                onChange={handleInputChange('aiAction')}
              >
                <option value="process">Process Data</option>
                <option value="summarize">Summarize</option>
                <option value="classify">Classify</option>
                <option value="generate">Generate Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prompt
              </label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Process the weather data and create a friendly summary for email..."
                rows={4}
                value={localConfig.prompt || ''}
                onChange={handleInputChange('prompt')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Model (Optional)
              </label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={localConfig.model || 'gpt-3.5-turbo'}
                onChange={handleInputChange('model')}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-2">Claude 2</option>
              </select>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                🤖 <strong>AI Processing:</strong> This will process the data from previous nodes using AI.
              </p>
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
                  {/* <button
                    onClick={handleStopScheduling}
                    disabled={!workflowId}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop Scheduling</span>
                  </button> */}
                  <button
                    onClick={handleClearAllSchedules}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm mt-2"
                  >
                    <span>Stop Scheduling</span>
                  </button>
                  <button
                    onClick={handleDebugScheduler}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <span>Check Schedules</span>
                  </button>
                  {/* <button
                    onClick={handleForceCheck}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    <span>Force Check Now</span>
                  </button> */}
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
                    <li>Click "Save" to persist configuration</li>
                    <li>Use "Run Once" to test immediately</li>
                    <li>Use "Schedule" to enable automatic execution</li>
                    <li>Use "Stop Scheduling" to disable automatic execution</li>
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