import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Workflow } from '@/types/workflow'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { Trash2 } from 'lucide-react'

async function getWorkflows(): Promise<Workflow[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []

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

// 🔥 DELETE SERVER ACTION
async function deleteWorkflow(id: string) {
  'use server'
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return

  await supabase.from('workflows').delete().eq('id', id)
  redirect('/workflows')
}

export default async function WorkflowsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')

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
              <div
                key={workflow.id}
                className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* RED DELETE BIN ICON */}
                <form action={deleteWorkflow.bind(null, workflow.id)}>
                  <button
                    type="submit"
                    className="absolute top-3 right-3 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </form>

                {/* Clicking the card still opens workflow */}
                <Link href={`/workflows/${workflow.id}`}>
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">
                    {workflow.name}
                  </h3>

                  {workflow.description && (
                    <p className="text-gray-600 mb-4 text-sm">
                      {workflow.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    {workflow.graph_data?.nodes?.length || 0} nodes • Updated{' '}
                    {new Date(workflow.updated_at).toLocaleDateString()}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
