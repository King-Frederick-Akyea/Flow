'use client'

import React, { useState } from 'react'
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'
import { WorkflowGraph } from '@/types/workflow'
import { executionEngine } from '@/lib/executionEngine'
import { Play, Save, Settings, Terminal, ChevronUp, ChevronDown, Trash2, Link } from 'lucide-react'

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

  const handleExecute = async () => {
    if (!workflowId) {
      setExecutionLog(prev => [...prev, '❌ Error: Please save the workflow first before executing'])
      alert('Please save the workflow first before executing')
      return
    }

    setIsExecuting(true)
    setActiveTab('logs')
    setExecutionLog(['🚀 Starting workflow execution...'])

    try {
      const graph = getCurrentGraph()
      const result = await executionEngine.executeWorkflow(workflowId, graph)
      
      setExecutionLog(prev => [
        ...prev,
        ...result.logs
      ])
    } catch (error: any) {
      setExecutionLog(prev => [...prev, `❌ Execution failed: ${error.message}`])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSave = () => {
    const graph = getCurrentGraph()
    onSave?.(graph)
    setExecutionLog(prev => [...prev, '💾 Workflow saved successfully'])
  }

  const handleConfigChange = (nodeId: string, field: string, value: any) => {
    const node = selectedNode!
    const currentConfig = node.data.config || {}
    
    onConfigUpdate(nodeId, {
      ...currentConfig,
      [field]: value
    })
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
      <div className="p-6">
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
    const config = nodeData.config || {}

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
                value={config.schedule || ''}
                onChange={(e) => handleConfigChange(node.id, 'schedule', e.target.value)}
              >
                <option value="every_minute">Every Minute</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily (9 AM)</option>
                <option value="weekly">Weekly (Monday 9 AM)</option>
                <option value="monthly">Monthly (1st 9 AM)</option>
              </select>
            </div>
          </div>
        )
      
      case 'dataSource':
        // Show configuration based on the fixed source
        switch (config.source) {
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
                    value={config.city || ''}
                    onChange={(e) => handleConfigChange(node.id, 'city', e.target.value)}
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
                    value={config.country || ''}
                    onChange={(e) => handleConfigChange(node.id, 'country', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Units
                  </label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={config.units || 'metric'}
                    onChange={(e) => handleConfigChange(node.id, 'units', e.target.value)}
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
                    value={config.repository || ''}
                    onChange={(e) => handleConfigChange(node.id, 'repository', e.target.value)}
                  />
                </div>
              </div>
            )
          
          default:
            return (
              <div className="text-slate-500 text-center py-8">
                Configuration for {config.source} data source
              </div>
            )
        }
      
      case 'action':
        // Show configuration based on the fixed action
        switch (config.action) {
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
                    value={config.to || ''}
                    onChange={(e) => handleConfigChange(node.id, 'to', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Weather Report for {{city}}"
                    value={config.subject || ''}
                    onChange={(e) => handleConfigChange(node.id, 'subject', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={`Current weather in {{city}}: {{temperature}}°C, {{condition}}`}
                    rows={4}
                    value={config.text || ''}
                    onChange={(e) => handleConfigChange(node.id, 'text', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use <code className="bg-slate-100 px-1 rounded">{'{{placeholders}}'}</code> for dynamic data
                  </p>
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
                    value={config.webhookUrl || ''}
                    onChange={(e) => handleConfigChange(node.id, 'webhookUrl', e.target.value)}
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
                    value={config.message || ''}
                    onChange={(e) => handleConfigChange(node.id, 'message', e.target.value)}
                  />
                </div>
              </div>
            )
          
          default:
            return (
              <div className="text-slate-500 text-center py-8">
                Configuration for {config.action} action
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
                value={config.condition || ''}
                onChange={(e) => handleConfigChange(node.id, 'condition', e.target.value)}
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
                value={config.description || ''}
                onChange={(e) => handleConfigChange(node.id, 'description', e.target.value)}
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
                value={config.prompt || ''}
                onChange={(e) => handleConfigChange(node.id, 'prompt', e.target.value)}
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
      {/* Resize Handle */}
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
                  {workflowId ? 'Ready to execute your workflow' : 'Save your workflow to start executing'}
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
                  onClick={handleExecute}
                  disabled={isExecuting || !workflowId}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>{isExecuting ? 'Running...' : 'Execute'}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6">
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
          </div>
        </div>
      </div>
    </div>
  )
}