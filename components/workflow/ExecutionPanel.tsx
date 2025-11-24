'use client'

import React, { useState } from 'react'
import { Node, NodeProps } from 'reactflow'
import { WorkflowGraph } from '@/types/workflow'
import { supabase } from '@/lib/supabase'
import { executionEngine } from '@/lib/executionEngine'

interface ExecutionPanelProps {
  selectedNode: Node | null
  workflowId?: string
  onConfigUpdate: (nodeId: string, config: any) => void
  getCurrentGraph: () => WorkflowGraph
  onSave?: (graph: WorkflowGraph) => void
}

export function ExecutionPanel({ 
  selectedNode, 
  workflowId, 
  onConfigUpdate, 
  getCurrentGraph,
  onSave 
}: ExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLog, setExecutionLog] = useState<string[]>([])

  const handleSave = async () => {
    if (!workflowId) return

    const graph = getCurrentGraph()
    const { error } = await supabase
      .from('workflows')
      .update({ 
        graph_data: graph,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    if (error) {
      console.error('Error saving workflow:', error)
      alert('Error saving workflow')
    } else {
      onSave?.(graph)
      alert('Workflow saved successfully!')
    }
  }

  const handleExecute = async () => {
    if (!workflowId) return

    setIsExecuting(true)
    setExecutionLog(['Starting workflow execution...'])

    try {
      const graph = getCurrentGraph()
      const result = await executionEngine.executeWorkflow(workflowId, graph)
      
      setExecutionLog(prev => [...prev, 'Execution completed!', JSON.stringify(result, null, 2)])
    } catch (error) {
      setExecutionLog(prev => [...prev, `Error: ${error}`])
    } finally {
      setIsExecuting(false)
    }
  }

  const renderNodeConfig = () => {
    if (!selectedNode) {
      return (
        <div className="p-4 text-gray-500">
          Select a node to configure its settings
        </div>
      )
    }

    return (
      <div className="p-4">
        <h3 className="font-semibold mb-4">Configure {selectedNode.data.label}</h3>
        {renderConfigForm(selectedNode)}
      </div>
    )
  }

  const renderConfigForm = (node: Node) => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={node.data.config?.schedule || ''}
                onChange={(e) => onConfigUpdate(node.id, { 
                  ...node.data.config, 
                  schedule: e.target.value 
                })}
              >
                <option value="">Select schedule</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Cron</option>
              </select>
            </div>
          </div>
        )
      
      case 'dataSource':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Source
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={node.data.config?.source || ''}
                onChange={(e) => onConfigUpdate(node.id, { 
                  ...node.data.config, 
                  source: e.target.value 
                })}
              >
                <option value="">Select source</option>
                <option value="weather">Weather API</option>
                <option value="github">GitHub</option>
                <option value="calendar">Google Calendar</option>
                <option value="sheets">Google Sheets</option>
              </select>
            </div>
          </div>
        )
      
      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={node.data.config?.action || ''}
                onChange={(e) => onConfigUpdate(node.id, { 
                  ...node.data.config, 
                  action: e.target.value 
                })}
              >
                <option value="">Select action</option>
                <option value="email">Send Email</option>
                <option value="slack">Slack Message</option>
                <option value="sms">SMS</option>
                <option value="social">Social Media</option>
              </select>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-gray-500">
            No configuration available for this node type.
          </div>
        )
    }
  }

  return (
    <div className="h-80 bg-white border-t border-gray-200 flex">
      {/* Node Configuration */}
      <div className="w-1/2 border-r border-gray-200">
        <div className="border-b border-gray-200 p-4 font-semibold">
          Node Configuration
        </div>
        {renderNodeConfig()}
      </div>

      {/* Execution Controls & Logs */}
      <div className="w-1/2 flex flex-col">
        <div className="border-b border-gray-200 p-4 font-semibold flex justify-between items-center">
          <span>Execution</span>
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Save Workflow
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
            >
              {isExecuting ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-gray-50">
          {executionLog.length === 0 ? (
            <div className="text-gray-500">Execution logs will appear here...</div>
          ) : (
            executionLog.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}