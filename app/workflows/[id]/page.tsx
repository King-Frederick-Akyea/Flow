import { notFound } from 'next/navigation'
import { WorkflowBuilder } from '@/components/workflow/Builder'
import { supabase } from '@/lib/supabase'
import { Workflow } from '@/types/workflow'

async function getWorkflow(id: string): Promise<Workflow | null> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching workflow:', error)
    return null
  }

  return data
}

interface WorkflowPageProps {
  params: {
    id: string
  }
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const workflow = await getWorkflow(params.id)

  if (!workflow) {
    notFound()
  }

  return (
    <div className="h-screen">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
        {workflow.description && (
          <p className="text-gray-600 mt-1">{workflow.description}</p>
        )}
      </div>
      <WorkflowBuilder 
        initialGraph={workflow.graph_data}
        workflowId={workflow.id}
      />
    </div>
  )
}