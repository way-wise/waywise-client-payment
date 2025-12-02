import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing.'
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const assigneeId = searchParams.get('assigneeId')
    const weekStart = searchParams.get('weekStart') // YYYY-MM-DD format
    const weekEnd = searchParams.get('weekEnd') // YYYY-MM-DD format

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (assigneeId) where.assigneeId = assigneeId
    if (weekStart && weekEnd) {
      where.date = {
        gte: new Date(weekStart),
        lte: new Date(weekEnd)
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          include: {
            client: true
          }
        },
        assignee: true
      },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch time entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing.'
      }, { status: 500 })
    }

    const body = await request.json()
    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId: body.projectId,
        assigneeId: body.assigneeId,
        date: new Date(body.date),
        hours: parseFloat(body.hours),
        description: body.description
      },
      include: {
        project: {
          include: {
            client: true
          }
        },
        assignee: true
      }
    })
    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json({ 
      error: 'Failed to create time entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

