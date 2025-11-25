import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Workflow } from '@/types/workflow'
import { createClient, getCurrentUser } from '@/lib/supabase-server'

async function getWorkflows(): Promise<Workflow[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching workflows:', error)
    return []
  }

  return data || []
}

export default async function WorkflowsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/')
  }

  const workflows = await getWorkflows()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Workflows</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.email}</p>
          </div>
          <Link
            href="/workflows/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create New Workflow
          </Link>
        </div>

        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No workflows yet</div>
            <Link
              href="/workflows/new"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create your first workflow
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {workflow.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {workflow.description && (
                  <p className="text-gray-600 mb-4 text-sm">
                    {workflow.description}
                  </p>
                )}
                
                <div className="text-xs text-gray-500">
                  {workflow.graph_data?.nodes?.length || 0} nodes • 
                  Updated {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}