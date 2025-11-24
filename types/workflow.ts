export interface Workflow {
  id: string
  name: string
  description?: string
  graph_data: WorkflowGraph
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface WorkflowGraph {
  nodes: Node[]
  edges: Edge[]
}

export interface Node {
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

export interface Edge {
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