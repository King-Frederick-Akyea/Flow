'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

const baseNodeClasses = "px-4 py-2 shadow-sm rounded-lg border-2 min-w-[150px]"

export const TriggerNode = ({ data }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-green-100 border-green-300`}>
    <Handle type="source" position={Position.Right} />
    <div className="font-semibold text-green-900">🚀 {data.label}</div>
    {data.config?.schedule && (
      <div className="text-xs text-green-700 mt-1">{data.config.schedule}</div>
    )}
  </div>
)

export const DataSourceNode = ({ data }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-blue-100 border-blue-300`}>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="font-semibold text-blue-900">📊 {data.label}</div>
    {data.config?.source && (
      <div className="text-xs text-blue-700 mt-1">{data.config.source}</div>
    )}
  </div>
)

export const LogicNode = ({ data }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-purple-100 border-purple-300`}>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="font-semibold text-purple-900">⚡ {data.label}</div>
  </div>
)

export const TransformNode = ({ data }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-yellow-100 border-yellow-300`}>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className="font-semibold text-yellow-900">🔧 {data.label}</div>
  </div>
)

export const ActionNode = ({ data }: NodeProps) => (
  <div className={`${baseNodeClasses} bg-red-100 border-red-300`}>
    <Handle type="target" position={Position.Left} />
    <div className="font-semibold text-red-900">🎯 {data.label}</div>
    {data.config?.action && (
      <div className="text-xs text-red-700 mt-1">{data.config.action}</div>
    )}
  </div>
)

export const NodeTypes = {
  TriggerNode,
  DataSourceNode,
  LogicNode,
  TransformNode,
  ActionNode,
}