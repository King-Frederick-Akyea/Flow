'use client'

import React, { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { 
  WorkflowGraph, 
  NodeType, 
  WorkflowNode, 
  WorkflowEdge,
  toReactFlowNode, 
  fromReactFlowNode,
  toReactFlowEdge,
  fromReactFlowEdge
} from '@/types/workflow'
import { Sidebar } from './Sidebar'
import { NodeTypes } from './NodeTypes'
import { ExecutionPanel } from './ExecutionPanel'
import { Play, Save, Workflow, Trash2 } from 'lucide-react'

const nodeTypes = {
  trigger: NodeTypes.TriggerNode,
  dataSource: NodeTypes.DataSourceNode,
  logic: NodeTypes.LogicNode,
  transform: NodeTypes.TransformNode,
  action: NodeTypes.ActionNode,
  ai: NodeTypes.AINode,
}

interface WorkflowBuilderProps {
  initialGraph?: WorkflowGraph
  workflowId?: string 
  onSave?: (graph: WorkflowGraph) => void
  name?: string
  description?: string
}

export function WorkflowBuilder({ initialGraph, workflowId, onSave, name, description }: WorkflowBuilderProps) {
  const initialNodes = initialGraph?.nodes.map(toReactFlowNode) || []
  const initialEdges = initialGraph?.edges.map(toReactFlowEdge) || []

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<ReactFlowEdge | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: ReactFlowNode) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }, [])

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: ReactFlowEdge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as NodeType
      const label = event.dataTransfer.getData('label')
      const icon = event.dataTransfer.getData('icon')

      if (!type) return

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      }

      let config = {}
      
      if (type === 'dataSource') {
        switch (label) {
          case 'Weather':
            config = { source: 'weather', city: 'London', units: 'metric' }
            break
          case 'GitHub':
            config = { source: 'githubs', repository: 'owner/repo' }
            break
          case 'HTTP Request':
            config = { source: 'http', url: 'https://api.example.com', method: 'GET' }
            break
          case 'Database':
            config = { source: 'database', query: 'SELECT * FROM table' }
            break
          default:
            config = { source: label.toLowerCase() }
        }
      } else if (type === 'action') {
        switch (label) {
          case 'Email':
            config = { action: 'email', to: '' }
            break
          case 'Slack':
            config = { 
              action: 'slack', 
              webhookUrl: 'https://hooks.slack.com/services/...',
              message: 'Workflow completed!'
            }
            break
          case 'Webhook':
            config = { 
              action: 'webhook', 
              webhookUrl: 'https://api.example.com/webhook',
              payload: '{"message": "Workflow executed"}'
            }
            break
          case 'SMS':
            config = { 
              action: 'sms', 
              phoneNumber: '+1234567890',
              message: 'Workflow completed!'
            }
            break
          case 'Notification':
            config = { 
              action: 'notification', 
              title: 'Workflow Update',
              message: 'Your workflow has been executed'
            }
            break
        }
      } else if (type === 'trigger') {
        switch (label) {
          case 'Schedule':
            config = { triggerType: 'schedule', schedule: 'daily' }
            break
          case 'Webhook':
            config = { triggerType: 'webhook' }
            break
          case 'Manual':
            config = { triggerType: 'manual' }
            break
        }
      } else if (type === 'logic') {
        config = { condition: 'temperature > 20' }
      } else if (type === 'transform') {
        config = { transformType: 'format', description: 'Transform data' }
      } else if (type === 'ai') {
        config = { aiAction: 'process', prompt: 'Process the data...' }
      }

      const newNode: ReactFlowNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label, icon, config },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
      setSelectedNode(null)
    }
  }, [selectedNode, setNodes])

  // Delete selected edge
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id))
      setSelectedEdge(null)
    }
  }, [selectedEdge, setEdges])

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        if (selectedNode) {
          deleteSelectedNode()
        } else if (selectedEdge) {
          deleteSelectedEdge()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNode, selectedEdge, deleteSelectedNode, deleteSelectedEdge])

  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    )
  }, [setNodes])

  const getCurrentGraph = useCallback((): WorkflowGraph => {
    const workflowNodes: WorkflowNode[] = nodes.map(fromReactFlowNode)
    const workflowEdges: WorkflowEdge[] = edges.map(fromReactFlowEdge)
    
    return { 
      nodes: workflowNodes, 
      edges: workflowEdges 
    }
  }, [nodes, edges])

  const handleSave = useCallback(() => {
    const graph = getCurrentGraph()
    onSave?.(graph)
  }, [getCurrentGraph, onSave])

  const handleExecute = useCallback(async () => {
    if (!workflowId) {
      alert('Please save the workflow first before executing')
      return
    }

    setIsExecuting(true)
    try {
      const graph = getCurrentGraph()
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Executing workflow:', graph)
    } catch (error) {
      console.error('Execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }, [workflowId, getCurrentGraph])

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <Workflow className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{name || 'Untitled Workflow'}</h1>
              {description && (
                <p className="text-sm text-slate-600">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Delete buttons */}
            {(selectedNode || selectedEdge) && (
              <button
                onClick={selectedNode ? deleteSelectedNode : deleteSelectedEdge}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {selectedNode ? 'Node' : 'Connection'}</span>
              </button>
            )}
            
            {/* <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button> */}
            
            {/* <button
              onClick={handleExecute}
              disabled={isExecuting || !workflowId}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isExecuting ? 'Running...' : 'Execute'}</span>
            </button> */}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
            >
            <Controls 
              className="bg-white shadow-lg border border-slate-200 rounded-lg p-1"
              position="top-right"
            />
            <Background 
              gap={20} 
              size={1} 
              color="#e2e8f0"
              className="opacity-30"
            />
            <MiniMap 
              nodeColor={(node: ReactFlowNode) => {
                switch (node.type) {
                  case 'trigger': return '#8b5cf6'
                  case 'dataSource': return '#3b82f6'
                  case 'ai': return '#6366f1'
                  case 'action': return '#f97316'
                  case 'logic': return '#10b981'
                  case 'transform': return '#eab308'
                  default: return '#9ca3af'
                }
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg"
              position="bottom-left"
            />
            
            {/* Only show help panel when no nodes exist */}
            {nodes.length === 0 && (
              <Panel position="top-center" className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-4">
                <div className="text-center">
                  <Workflow className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Start Building Your Workflow</h3>
                  <p className="text-slate-600">
                    Drag nodes from the sidebar to get started • Click to configure • Connect nodes to build automation
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Resizable Execution Panel */}
        <ExecutionPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onConfigUpdate={updateNodeConfig}
          workflowId={workflowId}
          getCurrentGraph={getCurrentGraph}
          onSave={onSave}
          name={name}
          description={description}
        />
      </div>
    </div>
  )
}