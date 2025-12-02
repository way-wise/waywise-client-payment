'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

  const handleQuickSelect = (type: 'current' | 'previous' | 'thisMonth') => {
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
    }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

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
                <Link href="/projects" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Projects
                </Link>
                <Link href="/time-tracking" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Time Tracking</h2>
            <p className="text-gray-600">
              Date Range: {start.toLocaleDateString()} - {end.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              />
            </div>
            <div className="flex items-center space-x-2 border-l pl-4">
              <button
                onClick={() => handleQuickSelect('current')}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Current Week
              </button>
              <button
                onClick={() => handleQuickSelect('previous')}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Previous Week
              </button>
              <button
                onClick={() => handleQuickSelect('thisMonth')}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                This Month
              </button>
            </div>
            <Link
              href="/time-entries"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Time Entry
            </Link>
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
            <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    {weeklyData.projectTotals && weeklyData.projectTotals.length > 0 ? (
                      weeklyData.projectTotals.map((item) => (
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
            </div>

            {/* Assignee Totals */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    {weeklyData.assigneeTotals && weeklyData.assigneeTotals.length > 0 ? (
                      weeklyData.assigneeTotals.map((item) => (
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
            </div>

            {/* Daily Entries */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    {weeklyData.entries && weeklyData.entries.length > 0 ? (
                      weeklyData.entries.map((entry) => (
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

