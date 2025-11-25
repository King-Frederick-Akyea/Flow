import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'

export interface Workflow {
  id: string
  name: string
  description?: string
  graph_data: WorkflowGraph
  created_at: string
  updated_at: string
  is_active: boolean
  user_id: string // Add this field
}

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: NodeData
}

export interface NodeData {
  label: string
  service?: string
  config?: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export type NodeType = 
  | 'trigger' 
  | 'dataSource' 
  | 'logic' 
  | 'transform' 
  | 'action'

export interface WorkflowRun {
  id: string
  workflow_id: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  logs: any[]
  error_message?: string
}

export function toReactFlowNode(node: WorkflowNode): ReactFlowNode {
  return {
    ...node,
  } as ReactFlowNode
}

export function fromReactFlowNode(node: ReactFlowNode): WorkflowNode {
  return {
    id: node.id,
    type: node.type as NodeType,
    position: node.position,
    data: node.data as NodeData
  }
}

export function toReactFlowEdge(edge: WorkflowEdge): ReactFlowEdge {
  return {
    ...edge
  } as ReactFlowEdge
}

export function fromReactFlowEdge(edge: ReactFlowEdge): WorkflowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target
  }
}

// Available services for each node type
export const TRIGGER_SERVICES = {
  SCHEDULE: 'schedule',
  CALENDAR: 'calendar',
  WEBHOOK: 'webhook'
} as const

export const DATA_SOURCES = {
  WEATHER: 'weather',
  GITHUB: 'github',
  CALENDAR: 'calendar',
  SHEETS: 'sheets'
} as const

export const ACTIONS = {
  EMAIL: 'email',
  SLACK: 'slack',
  SMS: 'sms',
  SOCIAL_MEDIA: 'social_media',
  SHEETS: 'sheets'
} as const