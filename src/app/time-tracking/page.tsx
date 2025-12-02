'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Pagination from '@/components/Pagination'

interface TimeEntry {
  id: string
  date: string
  hours: number
  description: string | null
  project: {
    id: string
    name: string
    hourlyRate: number | null
    billingType: string
    client: {
      name: string
    }
  }
  assignee: {
    id: string
    name: string
  }
}

interface WeeklyData {
  weekStart: string
  weekEnd: string
  projectTotals: Array<{
    project: any
    totalHours: number
    totalAmount: number
    entries: TimeEntry[]
  }>
  assigneeTotals: Array<{
    assignee: any
    totalHours: number
    entries: TimeEntry[]
  }>
  overallTotal: {
    totalHours: number
    totalAmount: number
  }
  entries: TimeEntry[]
}

export default function TimeTrackingPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectPage, setProjectPage] = useState(1)
  const [assigneePage, setAssigneePage] = useState(1)
  const [entriesPage, setEntriesPage] = useState(1)
  const itemsPerPage = 10
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

  useEffect(() => {
    fetchWeeklyData()
  }, [startDate, endDate])

  const fetchWeeklyData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/weekly-time?startDate=${startDate}&endDate=${endDate}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to fetch weekly data:', errorData)
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

  const getWeekRange = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return { start, end }
  }

  const handleQuickSelect = (type: 'current' | 'previous' | 'thisMonth' | 'previousMonth') => {
    const today = new Date()
    if (type === 'current') {
      const range = getWeekRange(today)
      setStartDate(range.start.toISOString().split('T')[0])
      setEndDate(range.end.toISOString().split('T')[0])
    } else if (type === 'previous') {
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)
      const range = getWeekRange(lastWeek)
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

  // Pagination calculations for project totals
  const projectTotalPages = Math.ceil((weeklyData?.projectTotals.length || 0) / itemsPerPage)
  const projectStartIndex = (projectPage - 1) * itemsPerPage
  const projectEndIndex = projectStartIndex + itemsPerPage
  const paginatedProjects = weeklyData?.projectTotals.slice(projectStartIndex, projectEndIndex) || []

  // Pagination calculations for assignee totals
  const assigneeTotalPages = Math.ceil((weeklyData?.assigneeTotals.length || 0) / itemsPerPage)
  const assigneeStartIndex = (assigneePage - 1) * itemsPerPage
  const assigneeEndIndex = assigneeStartIndex + itemsPerPage
  const paginatedAssignees = weeklyData?.assigneeTotals.slice(assigneeStartIndex, assigneeEndIndex) || []

  // Pagination calculations for daily entries
  const entriesTotalPages = Math.ceil((weeklyData?.entries.length || 0) / itemsPerPage)
  const entriesStartIndex = (entriesPage - 1) * itemsPerPage
  const entriesEndIndex = entriesStartIndex + itemsPerPage
  const paginatedEntries = weeklyData?.entries.slice(entriesStartIndex, entriesEndIndex) || []

  // Reset pages when date range changes
  useEffect(() => {
    setProjectPage(1)
    setAssigneePage(1)
    setEntriesPage(1)
  }, [startDate, endDate])

  // Determine active filter
  const getActiveFilter = () => {
    const today = new Date()
    const currentWeek = getWeekRange(today)
    const prevWeek = getWeekRange(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const startStr = startDate
    const endStr = endDate

    if (startStr === currentWeek.start.toISOString().split('T')[0] && 
        endStr === currentWeek.end.toISOString().split('T')[0]) {
      return 'current'
    }
    if (startStr === prevWeek.start.toISOString().split('T')[0] && 
        endStr === prevWeek.end.toISOString().split('T')[0]) {
      return 'previous'
    }
    if (startStr === thisMonthStart.toISOString().split('T')[0] && 
        endStr === thisMonthEnd.toISOString().split('T')[0]) {
      return 'thisMonth'
    }
    if (startStr === prevMonthStart.toISOString().split('T')[0] && 
        endStr === prevMonthEnd.toISOString().split('T')[0]) {
      return 'previousMonth'
    }
    return 'custom'
  }

  const activeFilter = getActiveFilter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking</h1>
            <p className="text-gray-600">
              {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Link
            href="/time-entries"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Time Entry
          </Link>
        </div>

        {/* Beautiful Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Filter by Date Range</h2>
          </div>

          {/* Quick Select Buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickSelect('current')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeFilter === 'current'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Current Week
              </button>
              <button
                onClick={() => handleQuickSelect('previous')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeFilter === 'previous'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Week
              </button>
              <button
                onClick={() => handleQuickSelect('thisMonth')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeFilter === 'thisMonth'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                This Month
              </button>
              <button
                onClick={() => handleQuickSelect('previousMonth')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeFilter === 'previousMonth'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Month
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Custom Date Range</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start Date
                  </span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    End Date
                  </span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ) : weeklyData ? (
          <div className="space-y-6">
            {/* Overall Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Week Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{weeklyData.overallTotal.totalHours.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${weeklyData.overallTotal.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Totals */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">By Project</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProjects.length > 0 ? (
                      paginatedProjects.map((item) => (
                      <tr key={item.project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.project.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.project.client.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalHours.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.project.hourlyRate ? `$${item.project.hourlyRate.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No project data for this week
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {weeklyData.projectTotals && weeklyData.projectTotals.length > itemsPerPage && (
                <Pagination
                  currentPage={projectPage}
                  totalPages={projectTotalPages}
                  onPageChange={setProjectPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={weeklyData.projectTotals.length}
                />
              )}
            </div>

            {/* Assignee Totals */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">By Assignee</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAssignees.length > 0 ? (
                      paginatedAssignees.map((item) => (
                      <tr key={item.assignee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.assignee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalHours.toFixed(2)}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                          No assignee data for this week
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {weeklyData.assigneeTotals && weeklyData.assigneeTotals.length > itemsPerPage && (
                <Pagination
                  currentPage={assigneePage}
                  totalPages={assigneeTotalPages}
                  onPageChange={setAssigneePage}
                  itemsPerPage={itemsPerPage}
                  totalItems={weeklyData.assigneeTotals.length}
                />
              )}
            </div>

            {/* Daily Entries */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Daily Entries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedEntries.length > 0 ? (
                      paginatedEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.project.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {entry.assignee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.hours.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.description || '-'}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No time entries for this week
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {weeklyData.entries && weeklyData.entries.length > itemsPerPage && (
                <Pagination
                  currentPage={entriesPage}
                  totalPages={entriesTotalPages}
                  onPageChange={setEntriesPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={weeklyData.entries.length}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No time entries for this week</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different week or add time entries</p>
          </div>
        )}
      </main>
    </div>
  )
}

