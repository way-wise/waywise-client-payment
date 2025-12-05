'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'

interface Project {
  id: string
  name: string
  hourlyRate: number | null
  billingType: string
  client: {
    name: string
  }
}

interface Assignee {
  id: string
  name: string
}

interface TimeEntry {
  id: string
  date: string
  hours: number
  entryHour: number | null
  entryMinute: number | null
  description: string | null
  project: Project
  assignee: Assignee
}

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filterDate, setFilterDate] = useState(() => {
    // Default to today's date
    return new Date().toISOString().split('T')[0]
  })
  const [formData, setFormData] = useState({
    projectId: '',
    assigneeId: '',
    date: new Date().toISOString().split('T')[0],
    entryHour: '',
    entryMinute: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [entriesRes, projectsRes, assigneesRes] = await Promise.all([
        fetch('/api/time-entries'),
        fetch('/api/projects'),
        fetch('/api/assignees')
      ])
      
      const [entriesData, projectsData, assigneesData] = await Promise.all([
        entriesRes.json(),
        projectsRes.json(),
        assigneesRes.json()
      ])
      
      setEntries(Array.isArray(entriesData) ? entriesData : [])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setAssignees(Array.isArray(assigneesData) ? assigneesData : [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editing ? `/api/time-entries/${editing.id}` : '/api/time-entries'
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
      setFormData({
        projectId: '',
        assigneeId: '',
        date: new Date().toISOString().split('T')[0],
        entryHour: '',
        entryMinute: '',
        description: ''
      })
    }
  }

  const handleEdit = (entry: TimeEntry) => {
    setEditing(entry)
    // If entryHour and entryMinute exist, use them; otherwise calculate from hours
    let hour = ''
    let minute = ''
    if (entry.entryHour !== null && entry.entryMinute !== null) {
      hour = entry.entryHour.toString()
      minute = entry.entryMinute.toString()
    } else {
      // Calculate from hours (e.g., 8.5 hours = 8 hours 30 minutes)
      const totalMinutes = Math.round(entry.hours * 60)
      hour = Math.floor(totalMinutes / 60).toString()
      minute = (totalMinutes % 60).toString()
    }
    setFormData({
      projectId: entry.project.id,
      assigneeId: entry.assignee.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      entryHour: hour,
      entryMinute: minute,
      description: entry.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return
    const res = await fetch(`/api/time-entries/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const openModal = () => {
    setEditing(null)
    setFormData({
      projectId: '',
      assigneeId: '',
      date: new Date().toISOString().split('T')[0],
      entryHour: '',
      entryMinute: '',
      description: ''
    })
    setShowModal(true)
  }

  // Filter entries by selected date
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date).toISOString().split('T')[0]
    return entryDate === filterDate
  })

  // Pagination calculations for filtered entries
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex)

  // Calculate total hours for filtered entries
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterDate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Entries</h1>
            <p className="text-gray-600">Track daily hours worked on projects</p>
          </div>
          <button
            onClick={openModal}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Time Entry
          </button>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Today
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total Hours: </span>
              <span className="text-lg font-bold text-indigo-600">{totalHours.toFixed(2)}h</span>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
          title={editing ? 'Edit Time Entry' : 'Add New Time Entry'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee *</label>
                <select
                  required
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select assignee</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      required
                      value={formData.entryHour}
                      onChange={(e) => setFormData({ ...formData, entryHour: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Hours"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Hours</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      required
                      value={formData.entryMinute}
                      onChange={(e) => setFormData({ ...formData, entryMinute: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Minutes"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Minutes</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                rows={3}
                placeholder="What did you work on?"
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
                {editing ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </form>
        </Modal>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries for this date</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No entries found for {new Date(filterDate).toLocaleDateString()}. Try selecting a different date or create a new entry.
                </p>
                <div className="mt-6">
                  <button
                    onClick={openModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Time Entry
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assignee</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{entry.project.name}</div>
                          <div className="text-xs text-gray-500">{entry.project.client.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{entry.assignee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.entryHour !== null && entry.entryMinute !== null
                              ? `${entry.entryHour}h ${entry.entryMinute}m`
                              : `${entry.hours.toFixed(2)}h`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">{entry.description || <span className="text-gray-400">—</span>}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredEntries.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredEntries.length}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
