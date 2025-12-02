'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TimeEntry {
  id: string
  date: string
  hours: number
  project: {
    id: string
    name: string
    hourlyRate: number | null
    billingType: string
    client: {
      id: string
      name: string
    }
  }
  assignee: {
    id: string
    name: string
  }
}

interface ProjectData {
  project: {
    id: string
    name: string
    hourlyRate: number | null
    billingType: string
    client: {
      id: string
      name: string
    }
  }
  totalHours: number
  totalAmount: number
  entries: TimeEntry[]
  assignees?: string[]
}

interface WeeklyData {
  weekStart: string
  weekEnd: string
  projectTotals: ProjectData[]
  overallTotal: {
    totalHours: number
    totalAmount: number
  }
}

export default function Home() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday
    date.setDate(diff)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday
    date.setDate(diff)
    date.setDate(date.getDate() + 6) // Sunday
    return date.toISOString().split('T')[0]
  })
  const [filterType, setFilterType] = useState<'all' | 'hourly' | 'fixed'>('all')

  useEffect(() => {
    fetchWeeklyData()
  }, [startDate, endDate])

  const getWeekRange = (date: Date = new Date()) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6) // Sunday
    end.setHours(23, 59, 59, 999)
    
    return { start, end }
  }

  const getCurrentWeek = () => {
    return getWeekRange(new Date())
  }

  const getPreviousWeek = () => {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return getWeekRange(lastWeek)
  }

  const fetchWeeklyData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/weekly-time?startDate=${startDate}&endDate=${endDate}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API error:', errorData)
        setWeeklyData(null)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.error) {
        console.error('API returned error:', data)
        setWeeklyData(null)
      } else {
        setWeeklyData(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching weekly data:', error)
      setWeeklyData(null)
      setLoading(false)
    }
  }

  const handleQuickSelect = (type: 'current' | 'previous' | 'thisMonth' | 'previousMonth') => {
    const today = new Date()
    if (type === 'current') {
      const range = getCurrentWeek()
      setStartDate(range.start.toISOString().split('T')[0])
      setEndDate(range.end.toISOString().split('T')[0])
    } else if (type === 'previous') {
      const range = getPreviousWeek()
      setStartDate(range.start.toISOString().split('T')[0])
      setEndDate(range.end.toISOString().split('T')[0])
    } else if (type === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(lastDay.toISOString().split('T')[0])
    } else if (type === 'previousMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(lastDay.toISOString().split('T')[0])
    }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  const filteredProjects = weeklyData?.projectTotals.filter(item => {
    if (filterType === 'all') return true
    if (filterType === 'hourly') return item.project.billingType === 'hourly'
    if (filterType === 'fixed') return item.project.billingType === 'fixed'
    return true
  }) || []

  // Calculate payment status
  const getPaymentStatus = (project: ProjectData) => {
    if (project.project.billingType === 'fixed') {
      return 'Fixed Price'
    }
    
    // For hourly projects
    const totalDue = project.totalAmount
    if (totalDue === 0) return 'No hours'
    
    // Check if project has payments (we'll enhance this later with actual payment tracking)
    // For now, show Pending for hourly projects with hours
    // TODO: Check actual payments to determine if completed
    return 'Pending'
  }
  
  const isStatusCompleted = (status: string) => {
    return status === 'Completed' || status === 'Fixed Price'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Project Time Tracking</h1>
              <div className="flex space-x-4">
                <Link href="/" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/clients" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Clients
                </Link>
                <Link href="/projects" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Dashboard</h2>
          <p className="text-gray-600">Track time, payments, and project status</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'hourly' | 'fixed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              >
                <option value="all">All Projects</option>
                <option value="hourly">Hourly Projects</option>
                <option value="fixed">Fixed Price Projects</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date Range:</span> {start.toLocaleDateString()} - {end.toLocaleDateString()}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuickSelect('current')}
                  className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Current Week
                </button>
                <button
                  onClick={() => handleQuickSelect('previous')}
                  className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Previous Week
                </button>
                <button
                  onClick={() => handleQuickSelect('thisMonth')}
                  className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  This Month
                </button>
                <button
                  onClick={() => handleQuickSelect('previousMonth')}
                  className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Previous Month
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : weeklyData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-3xl font-bold text-gray-900">{weeklyData.overallTotal.totalHours.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-green-600">${weeklyData.overallTotal.totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-blue-600">{filteredProjects.length}</p>
            </div>
          </div>
        ) : !loading ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="text-gray-500 text-center">No time entries found for this week</p>
          </div>
        ) : null}

        {/* Main Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : weeklyData && weeklyData.projectTotals && weeklyData.projectTotals.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No projects found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((item) => {
                      // Get unique assignees for this project
                      const assignees = item.assignees 
                        ? item.assignees.join(', ')
                        : Array.from(
                            new Set(item.entries.map(e => e.assignee.name))
                          ).join(', ') || 'N/A'
                      
                      const status = getPaymentStatus(item)
                      const isCompleted = isStatusCompleted(status)

                      return (
                        <tr key={item.project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.project.client.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.project.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.project.billingType === 'hourly' ? 'Hourly' : 'Fixed'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{assignees}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.totalHours.toFixed(2)}h
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.project.hourlyRate 
                                ? `$${item.project.hourlyRate.toFixed(2)}` 
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {item.project.billingType === 'hourly' 
                                ? `$${item.totalAmount.toFixed(2)}`
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isCompleted 
                                ? 'bg-green-100 text-green-800'
                                : status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : !loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No projects with time entries for this week</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different week or add time entries</p>
          </div>
        ) : null}
      </main>
    </div>
  )
}
