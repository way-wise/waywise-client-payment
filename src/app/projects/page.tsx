'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
}

interface ProjectType {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
  client: Client
  projectType: ProjectType
  budget: number
  description: string | null
  status: string
  milestones: Array<{
    id: string
    name: string
    amount: number
    dueDate: string
    status: string
    payments: Array<{ amount: number }>
  }>
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [types, setTypes] = useState<ProjectType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    projectTypeId: '',
    budget: '',
    billingType: 'fixed',
    hourlyRate: '',
    description: '',
    status: 'active'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes, typesRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/clients'),
        fetch('/api/project-types')
      ])
      const [projectsData, clientsData, typesData] = await Promise.all([
        projectsRes.json(),
        clientsRes.json(),
        typesRes.json()
      ])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setClients(Array.isArray(clientsData) ? clientsData : [])
      setTypes(Array.isArray(typesData) ? typesData : [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setProjects([])
      setClients([])
      setTypes([])
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editing ? `/api/projects/${editing.id}` : '/api/projects'
    const method = editing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      fetchData()
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', clientId: '', projectTypeId: '', budget: '', billingType: 'fixed', hourlyRate: '', description: '', status: 'active' })
    }
  }

  const handleEdit = (project: Project) => {
    setEditing(project)
      setFormData({
        name: project.name,
        clientId: project.client.id,
        projectTypeId: project.projectType.id,
        budget: project.budget.toString(),
        billingType: (project as any).billingType || 'fixed',
        hourlyRate: (project as any).hourlyRate ? (project as any).hourlyRate.toString() : '',
        description: project.description || '',
        status: project.status
      })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const getTotalPaid = (project: Project) => {
    return project.milestones.reduce((sum, m) => {
      const paid = m.payments.reduce((pSum, p) => pSum + p.amount, 0)
      return sum + paid
    }, 0)
  }

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
                <Link href="/time-tracking" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Time Tracking
                </Link>
                <Link href="/assignees" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Assignees
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
            <p className="text-gray-600">Manage your projects and milestones</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditing(null)
              setFormData({ name: '', clientId: '', projectTypeId: '', budget: '', billingType: 'fixed', hourlyRate: '', description: '', status: 'active' })
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Project
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
                  <select
                    required
                    value={formData.projectTypeId}
                    onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="">Select type</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type *</label>
                  <select
                    required
                    value={formData.billingType}
                    onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.billingType === 'fixed' ? 'Budget *' : 'Budget'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={formData.billingType === 'fixed'}
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.billingType === 'hourly' ? 'Hourly Rate *' : 'Hourly Rate'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={formData.billingType === 'hourly'}
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    placeholder="50.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditing(null)
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const totalPaid = getTotalPaid(project)
              const totalBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0) || project.budget
              return (
                <div key={project.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">
                        {project.client.name} • {project.projectType.name} • 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Budget: ${project.budget.toLocaleString()} • 
                        Paid: ${totalPaid.toLocaleString()} • 
                        Remaining: ${(totalBudget - totalPaid).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

