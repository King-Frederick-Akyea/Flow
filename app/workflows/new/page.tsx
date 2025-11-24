'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkflowBuilder } from '@/components/workflow/Builder'
import { supabase } from '@/lib/supabase'
import { WorkflowGraph } from '@/types/workflow'

export default function NewWorkflowPage() {
  const router = useRouter()
  const [workflowId, setWorkflowId] = useState<string | null>(null)

  const handleSave = async (graph: WorkflowGraph) => {
    if (!workflowId) {
      // Create new workflow
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: `Workflow ${new Date().toLocaleDateString()}`,
          description: 'New workflow',
          graph_data: graph
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating workflow:', error)
        return
      }

      setWorkflowId(data.id)
      router.push(`/workflows/${data.id}`)
    }
  }

  return (
    <div className="h-screen">
      <WorkflowBuilder onSave={handleSave} />
    </div>
  )
}