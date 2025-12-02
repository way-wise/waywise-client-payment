'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Milestone {
  id: string
  name: string
  amount: number
  dueDate: string
  status: string
  description: string | null
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    notes: string | null
  }>
}

interface Project {
  id: string
  name: string
  client: { id: string; name: string }
  projectType: { id: string; name: string }
  budget: number
  description: string | null
  status: string
  milestones: Milestone[]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<string>('')
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    amount: '',
    dueDate: '',
    description: ''
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    if (params.id) fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      const data = await res.json()
      if (data.error) {
        console.error('API error:', data)
        setProject(null)
      } else {
        setProject(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching project:', error)
      setProject(null)
      setLoading(false)
    }
  }

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...milestoneForm,
        projectId: params.id
      })
    })
    if (res.ok) {
      fetchProject()
      setShowMilestoneForm(false)
      setMilestoneForm({ name: '', amount: '', dueDate: '', description: '' })
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...paymentForm,
        milestoneId: selectedMilestone
      })
    })
    if (res.ok) {
      fetchProject()
      setShowPaymentForm(false)
      setPaymentForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' })
      setSelectedMilestone('')
    }
  }

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Are you sure?')) return
    const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    if (res.ok) fetchProject()
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure?')) return
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    if (res.ok) fetchProject()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }
  if (!project) return <div className="text-center py-12">Project not found</div>

  const totalPaid = project.milestones.reduce((sum, m) => {
    return sum + m.payments.reduce((pSum, p) => pSum + p.amount, 0)
  }, 0)

  const totalBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0) || project.budget

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-gray-900">Project Time Tracking</Link>
              <div className="flex space-x-4">
                <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/clients" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Clients
                </Link>
                <Link href="/projects" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Projects
                </Link>
                <Link href="/project-types" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Project Types
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/projects" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Projects
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <p className="text-gray-600 mb-4">
            Client: {project.client.name} • Type: {project.projectType.name} • 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-lg font-semibold">${totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-lg font-semibold text-green-600">${totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-lg font-semibold text-red-600">${(totalBudget - totalPaid).toLocaleString()}</p>
            </div>
          </div>
          {project.description && (
            <p className="text-gray-700">{project.description}</p>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Milestones</h2>
          <button
            onClick={() => setShowMilestoneForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Milestone
          </button>
        </div>

        {showMilestoneForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add Milestone</h3>
            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={milestoneForm.name}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={milestoneForm.amount}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  rows={2}
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {project.milestones.map((milestone) => {
            const paid = milestone.payments.reduce((sum, p) => sum + p.amount, 0)
            const remaining = milestone.amount - paid
            const isOverdue = new Date(milestone.dueDate) < new Date() && remaining > 0

            return (
              <div key={milestone.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()} • 
                      Amount: ${milestone.amount.toLocaleString()} • 
                      Paid: ${paid.toLocaleString()} • 
                      Remaining: ${remaining.toLocaleString()}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                      milestone.status === 'paid' ? 'bg-green-100 text-green-800' :
                      isOverdue ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone.id)
                        setShowPaymentForm(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Add Payment
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {milestone.payments.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Payments</h4>
                    <div className="space-y-2">
                      {milestone.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <p className="text-sm font-medium">${payment.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                              {payment.notes && ` • ${payment.notes}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    rows={2}
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Add Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false)
                      setSelectedMilestone('')
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

