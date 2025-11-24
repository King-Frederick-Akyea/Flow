'use client'

import React from 'react'

const nodeGroups = [
  {
    title: 'Triggers',
    nodes: [
      { type: 'trigger', label: 'Schedule', icon: '⏰', description: 'Run on a schedule' },
      { type: 'trigger', label: 'Calendar', icon: '📅', description: 'When calendar event starts' },
      { type: 'trigger', label: 'Webhook', icon: '🌐', description: 'On webhook call' },
    ],
  },
  {
    title: 'Data Sources',
    nodes: [
      { type: 'dataSource', label: 'Weather', icon: '☀️', description: 'Get weather data' },
      { type: 'dataSource', label: 'GitHub', icon: '💻', description: 'GitHub activity' },
      { type: 'dataSource', label: 'Calendar', icon: '📅', description: 'Calendar events' },
      { type: 'dataSource', label: 'Sheets', icon: '📊', description: 'Google Sheets data' },
    ],
  },
  {
    title: 'Logic & Transform',
    nodes: [
      { type: 'logic', label: 'Condition', icon: '❓', description: 'If/then logic' },
      { type: 'transform', label: 'Format', icon: '🔧', description: 'Transform data' },
      { type: 'transform', label: 'AI Process', icon: '🤖', description: 'AI processing' },
    ],
  },
  {
    title: 'Actions',
    nodes: [
      { type: 'action', label: 'Email', icon: '📧', description: 'Send email' },
      { type: 'action', label: 'Slack', icon: '💬', description: 'Slack message' },
      { type: 'action', label: 'SMS', icon: '📱', description: 'Send SMS' },
      { type: 'action', label: 'Social Media', icon: '📢', description: 'Post to social media' },
    ],
  },
]

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('label', label)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Nodes</h2>
        
        {nodeGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{group.title}</h3>
            <div className="space-y-2">
              {group.nodes.map((node) => (
                <div
                  key={node.label}
                  className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, node.label)}
                >
                  <span className="text-lg mr-3">{node.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{node.label}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
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