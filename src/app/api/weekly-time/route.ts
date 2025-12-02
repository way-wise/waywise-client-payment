import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to get start and end of week
function getWeekRange(date: Date = new Date()) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing.'
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const weekDate = searchParams.get('date') 
      ? new Date(searchParams.get('date')!) 
      : new Date()

    const { start, end } = getWeekRange(weekDate)

    // Get all time entries for the week
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        project: {
          include: {
            client: true
          }
        },
        assignee: true
      },
      orderBy: { date: 'asc' }
    })

    // Group by project and calculate totals
    const projectTotals: Record<string, {
      project: any
      totalHours: number
      totalAmount: number
      entries: any[]
    }> = {}

    timeEntries.forEach(entry => {
      const projectId = entry.projectId
      if (!projectTotals[projectId]) {
        projectTotals[projectId] = {
          project: entry.project,
          totalHours: 0,
          totalAmount: 0,
          entries: []
        }
      }
      projectTotals[projectId].totalHours += entry.hours
      projectTotals[projectId].entries.push(entry)
      
      // Calculate amount if hourly rate exists
      if (entry.project.hourlyRate) {
        projectTotals[projectId].totalAmount += entry.hours * entry.project.hourlyRate
      }
    })

    // Group by assignee
    const assigneeTotals: Record<string, {
      assignee: any
      totalHours: number
      entries: any[]
    }> = {}

    timeEntries.forEach(entry => {
      const assigneeId = entry.assigneeId
      if (!assigneeTotals[assigneeId]) {
        assigneeTotals[assigneeId] = {
          assignee: entry.assignee,
          totalHours: 0,
          entries: []
        }
      }
      assigneeTotals[assigneeId].totalHours += entry.hours
      assigneeTotals[assigneeId].entries.push(entry)
    })

    // Calculate overall totals
    const overallTotal = {
      totalHours: timeEntries.reduce((sum, e) => sum + e.hours, 0),
      totalAmount: Object.values(projectTotals).reduce((sum, p) => sum + p.totalAmount, 0)
    }

    return NextResponse.json({
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      projectTotals: Object.values(projectTotals),
      assigneeTotals: Object.values(assigneeTotals),
      overallTotal,
      entries: timeEntries
    })
  } catch (error) {
    console.error('Error fetching weekly time:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch weekly time',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

