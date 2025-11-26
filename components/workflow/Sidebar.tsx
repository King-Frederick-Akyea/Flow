'use client'

import React, { JSX } from 'react'
import { 
  Clock, 
  Calendar, 
  Cloud, 
  GitBranch, 
  Table, 
  Code, 
  Sliders, 
  Brain, 
  Mail, 
  MessageCircle, 
  Smartphone, 
  Share2,
  Zap,
  Globe,
  Workflow,
  Database
} from 'lucide-react'

const nodeGroups = [
  {
    title: 'Triggers',
    icon: <Zap className="w-4 h-4" />,
    nodes: [
      { type: 'trigger', label: 'Schedule', icon: 'clock', description: 'Run on a schedule' },
      { type: 'trigger', label: 'Webhook', icon: 'globe', description: 'On webhook call' },
      { type: 'trigger', label: 'Manual', icon: 'calendar', description: 'Manual trigger' },
    ],
  },
  {
    title: 'Data Sources',
    icon: <Database className="w-4 h-4" />,
    nodes: [
      { type: 'dataSource', label: 'Weather', icon: 'cloud', description: 'Get weather data' },
      { type: 'dataSource', label: 'GitHub', icon: 'git-branch', description: 'GitHub activity' },
      { type: 'dataSource', label: 'HTTP Request', icon: 'globe', description: 'API data fetch' },
      { type: 'dataSource', label: 'Database', icon: 'database', description: 'Database query' },
    ],
  },
  {
    title: 'Logic & Transform',
    icon: <Code className="w-4 h-4" />,
    nodes: [
      { type: 'logic', label: 'Condition', icon: 'code', description: 'If/then logic' },
      { type: 'transform', label: 'Data Transform', icon: 'sliders', description: 'Transform data' },
      { type: 'ai', label: 'AI Processing', icon: 'brain', description: 'AI processing' },
    ],
  },
  {
    title: 'Actions',
    icon: <Mail className="w-4 h-4" />,
    nodes: [
      { type: 'action', label: 'Email', icon: 'mail', description: 'Send email' },
      { type: 'action', label: 'Slack', icon: 'message-circle', description: 'Slack message' },
      { type: 'action', label: 'Webhook', icon: 'globe', description: 'Send webhook' },
      { type: 'action', label: 'SMS', icon: 'smartphone', description: 'Send SMS' },
      { type: 'action', label: 'Notification', icon: 'share2', description: 'Push notification' },
    ],
  },
]

const getNodeIcon = (iconName: string) => {
  const icons: { [key: string]: JSX.Element } = {
    'clock': <Clock className="w-4 h-4" />,
    'calendar': <Calendar className="w-4 h-4" />,
    'cloud': <Cloud className="w-4 h-4" />,
    'git-branch': <GitBranch className="w-4 h-4" />,
    'table': <Table className="w-4 h-4" />,
    'code': <Code className="w-4 h-4" />,
    'sliders': <Sliders className="w-4 h-4" />,
    'brain': <Brain className="w-4 h-4" />,
    'mail': <Mail className="w-4 h-4" />,
    'message-circle': <MessageCircle className="w-4 h-4" />,
    'smartphone': <Smartphone className="w-4 h-4" />,
    'share2': <Share2 className="w-4 h-4" />,
    'globe': <Globe className="w-4 h-4" />,
    'database': <Database className="w-4 h-4" />,
  }
  return icons[iconName] || <Zap className="w-4 h-4" />
}

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, icon: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('label', label)
    event.dataTransfer.setData('icon', icon)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Workflow className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Workflow Builder</h2>
            <p className="text-sm text-slate-600">Drag & drop to build automations</p>
          </div>
        </div>
        
        {nodeGroups.map((group) => (
          <div key={group.title} className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-slate-600">
                {group.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                {group.title}
              </h3>
            </div>
            
            <div className="space-y-3">
              {group.nodes.map((node) => (
                <div
                  key={node.label}
                  className="flex items-center p-4 bg-white rounded-xl border border-slate-200 cursor-move hover:shadow-lg hover:border-blue-300 hover:scale-[1.02] transition-all duration-200 group"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, node.label, node.icon)}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                    {getNodeIcon(node.icon)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{node.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{node.description}</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}