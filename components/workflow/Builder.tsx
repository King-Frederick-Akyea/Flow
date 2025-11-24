'use client'

import React, { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { WorkflowGraph, NodeType } from '@/types/workflow'
import { Sidebar } from './Sidebar'
import { NodeTypes } from './NodeTypes'
import { ExecutionPanel } from './ExecutionPanel'

const nodeTypes = {
  trigger: NodeTypes.TriggerNode,
  dataSource: NodeTypes.DataSourceNode,
  logic: NodeTypes.LogicNode,
  transform: NodeTypes.TransformNode,
  action: NodeTypes.ActionNode,
}

interface WorkflowBuilderProps {
  initialGraph?: WorkflowGraph
  workflowId?: string
  onSave?: (graph: WorkflowGraph) => void
}

export function WorkflowBuilder({ initialGraph, workflowId, onSave }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph?.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph?.edges || [])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as NodeType
      const label = event.dataTransfer.getData('label')

      if (!type) return

      const position = {
        x: event.clientX - 250, // Adjust for sidebar width
        y: event.clientY - 100,
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label, config: {} },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

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
    return { nodes, edges }
  }, [nodes, edges])

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'trigger': return '#6EE7B7'
                  case 'dataSource': return '#93C5FD'
                  case 'action': return '#FCA5A5'
                  default: return '#D1D5DB'
                }
              }}
            />
          </ReactFlow>
        </div>

        <ExecutionPanel
          selectedNode={selectedNode}
          onConfigUpdate={updateNodeConfig}
          workflowId={workflowId}
          getCurrentGraph={getCurrentGraph}
          onSave={onSave}
        />
      </div>
    </div>
  )
}