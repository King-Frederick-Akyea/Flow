'use client'

import React, { JSX } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
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
  Database
} from 'lucide-react'

const baseNodeClasses = "px-4 py-3 shadow-lg rounded-xl border-2 min-w-[180px] backdrop-blur-sm transition-all duration-200 hover:scale-105"

const getNodeIcon = (iconName: string, className: string = "w-5 h-5") => {
  const icons: { [key: string]: JSX.Element } = {
    'clock': <Clock className={className} />,
    'calendar': <Calendar className={className} />,
    'cloud': <Cloud className={className} />,
    'git-branch': <GitBranch className={className} />,
    'table': <Table className={className} />,
    'code': <Code className={className} />,
    'sliders': <Sliders className={className} />,
    'brain': <Brain className={className} />,
    'mail': <Mail className={className} />,
    'message-circle': <MessageCircle className={className} />,
    'smartphone': <Smartphone className={className} />,
    'share2': <Share2 className={className} />,
    'zap': <Zap className={className} />,
    'database': <Database className={className} />,
  }
  return icons[iconName] || <Zap className={className} />
}

export const TriggerNode = ({ data, selected }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-gradient-to-br from-purple-100 to-purple-50 border-purple-300 ${selected ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}>
    <Handle 
      type="source" 
      position={Position.Right} 
      className="w-4 h-4 bg-purple-500 border-2 border-white shadow-lg"
    />
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-purple-100 rounded-lg">
        {getNodeIcon(data.icon || 'zap', "w-4 h-4 text-purple-600")}
      </div>
      <div>
        <div className="font-semibold text-purple-900 text-sm">{data.label}</div>
        {data.config?.schedule && (
          <div className="text-xs text-purple-700 mt-1 font-medium">{data.config.schedule}</div>
        )}
      </div>
    </div>
  </div>
)

export const DataSourceNode = ({ data, selected }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300 ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
    <Handle 
      type="target" 
      position={Position.Left} 
      className="w-4 h-4 bg-blue-500 border-2 border-white shadow-lg"
    />
    <Handle 
      type="source" 
      position={Position.Right} 
      className="w-4 h-4 bg-blue-500 border-2 border-white shadow-lg"
    />
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        {getNodeIcon(data.icon || 'database', "w-4 h-4 text-blue-600")}
      </div>
      <div>
        <div className="font-semibold text-blue-900 text-sm">{data.label}</div>
        {data.config?.source && (
          <div className="text-xs text-blue-700 mt-1 font-medium">{data.config.source}</div>
        )}
      </div>
    </div>
  </div>
)

export const LogicNode = ({ data, selected }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-300 ${selected ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}>
    <Handle 
      type="target" 
      position={Position.Left} 
      className="w-4 h-4 bg-emerald-500 border-2 border-white shadow-lg"
    />
    <Handle 
      type="source" 
      position={Position.Right} 
      className="w-4 h-4 bg-emerald-500 border-2 border-white shadow-lg"
    />
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-emerald-100 rounded-lg">
        {getNodeIcon(data.icon || 'code', "w-4 h-4 text-emerald-600")}
      </div>
      <div className="font-semibold text-emerald-900 text-sm">{data.label}</div>
    </div>
  </div>
)

export const TransformNode = ({ data, selected }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300 ${selected ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
    <Handle 
      type="target" 
      position={Position.Left} 
      className="w-4 h-4 bg-amber-500 border-2 border-white shadow-lg"
    />
    <Handle 
      type="source" 
      position={Position.Right} 
      className="w-4 h-4 bg-amber-500 border-2 border-white shadow-lg"
    />
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-amber-100 rounded-lg">
        {getNodeIcon(data.icon || 'sliders', "w-4 h-4 text-amber-600")}
      </div>
      <div className="font-semibold text-amber-900 text-sm">{data.label}</div>
    </div>
  </div>
)

export const AINode = ({ data, selected }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-gradient-to-br from-indigo-100 to-indigo-50 border-indigo-300 ${selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}>
    <Handle 
      type="target" 
      position={Position.Left} 
      className="w-4 h-4 bg-indigo-500 border-2 border-white shadow-lg"
    />
    <Handle 
      type="source" 
      position={Position.Right} 
      className="w-4 h-4 bg-indigo-500 border-2 border-white shadow-lg"
    />
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-indigo-100 rounded-lg">
        {getNodeIcon(data.icon || 'brain', "w-4 h-4 text-indigo-600")}
      </div>
      <div className="font-semibold text-indigo-900 text-sm">{data.label}</div>
    </div>
  </div>
)

export const ActionNode = ({ data, selected }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300 ${selected ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
    <Handle 
      type="target" 
      position={Position.Left} 
      className="w-4 h-4 bg-orange-500 border-2 border-white shadow-lg"
    />
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-orange-100 rounded-lg">
        {getNodeIcon(data.icon || 'mail', "w-4 h-4 text-orange-600")}
      </div>
      <div>
        <div className="font-semibold text-orange-900 text-sm">{data.label}</div>
        {data.config?.action && (
          <div className="text-xs text-orange-700 mt-1 font-medium">{data.config.action}</div>
        )}
      </div>
    </div>
  </div>
)

export const NodeTypes = {
  TriggerNode,
  DataSourceNode,
  LogicNode,
  TransformNode,
  AINode,
  ActionNode,
}