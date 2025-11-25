'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkflowBuilder } from '@/components/workflow/Builder'
import { supabase } from '@/lib/supabase'
import { WorkflowGraph } from '@/types/workflow'
import { useUser } from '@/lib/auth'

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string) => void
  isLoading: boolean
}

function SaveModal({ isOpen, onClose, onSave, isLoading }: SaveModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name, description)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Save Workflow</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter workflow name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AuthModal({ isOpen, onClose, onAuthenticated }: { isOpen: boolean; onClose: () => void; onAuthenticated: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { signIn, signUp } = await import('@/lib/auth')
      
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          onAuthenticated()
          onClose()
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setError('Check your email for verification link!')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">{isLogin ? 'Login Required' : 'Sign Up'}</h2>
        <p className="text-gray-600 mb-4 text-sm">
          You need to be logged in to save workflows.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your password"
            />
          </div>
          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? '...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewWorkflowPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentGraph, setCurrentGraph] = useState<WorkflowGraph | null>(null)

  const handleSaveRequest = (graph: WorkflowGraph) => {
    if (!user) {
      setCurrentGraph(graph)
      setIsAuthModalOpen(true)
      return
    }
    
    setCurrentGraph(graph)
    setIsSaveModalOpen(true)
  }

  const handleSaveConfirm = async (name: string, description: string) => {
    if (!currentGraph || !user) return

    setIsSaving(true)
    
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: name.trim(),
          description: description.trim() || 'My automated workflow',
          graph_data: currentGraph,
          is_active: false,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating workflow:', error)
        alert('Error creating workflow: ' + error.message)
        return
      }

      setIsSaveModalOpen(false)
      setCurrentGraph(null)
      // Redirect to the workflow page
      router.push(`/workflows/${data.id}`)
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAuthenticated = () => {
    if (currentGraph) {
      setIsSaveModalOpen(true)
    }
  }

  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Workflow</h1>
          <p className="text-gray-600 mt-1">Drag and drop nodes to build your automation workflow</p>
        </div>
        {user && (
          <div className="text-sm text-gray-600">
            Logged in as: {user.email}
          </div>
        )}
      </div>
      <div className="flex-1">
        <WorkflowBuilder 
          onSave={handleSaveRequest}
        />
      </div>
      
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveConfirm}
        isLoading={isSaving}
      />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  )
}