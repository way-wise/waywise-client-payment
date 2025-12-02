'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Modal from '@/components/Modal'

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
  const [showModal, setShowModal] = useState(false)
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
      setShowModal(false)
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
    setShowModal(true)
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

  const openModal = () => {
    setEditing(null)
    setFormData({ name: '', clientId: '', projectTypeId: '', budget: '', billingType: 'fixed', hourlyRate: '', description: '', status: 'active' })
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage your projects and milestones</p>
          </div>
          <button
            onClick={openModal}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
          title={editing ? 'Edit Project' : 'Add New Project'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Project name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
                <select
                  required
                  value={formData.projectTypeId}
                  onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Type *</label>
                <select
                  required
                  value={formData.billingType}
                  onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.billingType === 'fixed' ? 'Budget *' : 'Budget'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required={formData.billingType === 'fixed'}
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.billingType === 'hourly' ? 'Hourly Rate *' : 'Hourly Rate'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required={formData.billingType === 'hourly'}
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="50.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                rows={3}
                placeholder="Project description..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditing(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                {editing ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                <div className="mt-6">
                  <button
                    onClick={openModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Project
                  </button>
                </div>
              </div>
            ) : (
              projects.map((project) => {
                const totalPaid = getTotalPaid(project)
                const totalBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0) || project.budget
                return (
                  <div key={project.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{project.client.name}</span> • {project.projectType.name} • 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            project.status === 'active' ? 'bg-green-100 text-green-800' :
                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="font-medium">Budget: <span className="text-gray-900">${project.budget.toLocaleString()}</span></span>
                          <span className="font-medium">Paid: <span className="text-green-600">${totalPaid.toLocaleString()}</span></span>
                          <span className="font-medium">Remaining: <span className="text-orange-600">${(totalBudget - totalPaid).toLocaleString()}</span></span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleEdit(project)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
