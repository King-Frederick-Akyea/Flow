import { notFound } from 'next/navigation'
import { WorkflowBuilder } from '@/components/workflow/Builder'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { Workflow, WorkflowGraph } from '@/types/workflow'

async function getWorkflow(id: string): Promise<Workflow | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching workflow:', error)
    return null
  }

  return data
}

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  const workflow = await getWorkflow(id)

  if (!workflow) {
    notFound()
  }

  const handleSave = async (graph: WorkflowGraph) => {
    'use server'
    
    const supabase = await createClient()
    const user = await getCurrentUser()
    
    if (!user) {
      return { error: 'Authentication required' }
    }

    try {
      const { error } = await supabase
        .from('workflows')
        .update({ 
          graph_data: graph,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating workflow:', error)
        return { error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { error: 'Unexpected error occurred' }
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
        {workflow.description && (
          <p className="text-gray-600 mt-1">{workflow.description}</p>
        )}
      </div> */}
      <div className="flex-1">
        <WorkflowBuilder 
          initialGraph={workflow.graph_data}
          workflowId={workflow.id}
          name={workflow.name}
          description={workflow.description}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}