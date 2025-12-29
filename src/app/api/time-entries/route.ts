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
    
    // Calculate hours from entryHour and entryMinute if provided, otherwise use hours field
    let calculatedHours = parseFloat(body.hours) || 0
    const entryHour = body.entryHour !== undefined && body.entryHour !== '' ? parseInt(body.entryHour) : null
    const entryMinute = body.entryMinute !== undefined && body.entryMinute !== '' ? parseInt(body.entryMinute) : null
    
    if (entryHour !== null && entryMinute !== null) {
      calculatedHours = entryHour + (entryMinute / 60)
    }
    
    // Build data object, conditionally including new fields
    const baseData: any = {
      projectId: body.projectId,
      assigneeId: body.assigneeId,
      date: new Date(body.date),
      hours: calculatedHours,
      description: body.description
    }
    
    // Try to include new fields if they have valid values
    const dataWithNewFields = { ...baseData }
    if (entryHour !== null) {
      dataWithNewFields.entryHour = entryHour
    }
    if (entryMinute !== null) {
      dataWithNewFields.entryMinute = entryMinute
    }
    
    // Try creating with new fields first, fallback to base data if columns don't exist
    let timeEntry
    const hasNewFields = entryHour !== null || entryMinute !== null
    
    try {
      timeEntry = await prisma.timeEntry.create({
        data: hasNewFields ? dataWithNewFields : baseData,
        include: {
          project: {
            include: {
              client: true
            }
          },
          assignee: true
        }
      })
    } catch (error: any) {
      // If we tried to use new fields and got an error, retry without them
      if (hasNewFields) {
        const errorMessage = String(error?.message || '').toLowerCase()
        const isColumnError = 
          errorMessage.includes('column') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('unknown column') ||
          errorMessage.includes('undefined column') ||
          error?.code === 'P2001' || 
          error?.code === 'P2011' ||
          error?.code === '42703' || // PostgreSQL error code for undefined column
          error?.code?.startsWith('P') // Any Prisma error code
        
        if (isColumnError) {
          console.warn('New columns not found, creating entry without entryHour/entryMinute. Error:', error?.message)
          try {
            timeEntry = await prisma.timeEntry.create({
              data: baseData,
              include: {
                project: {
                  include: {
                    client: true
                  }
                },
                assignee: true
              }
            })
          } catch (retryError) {
            // If retry also fails, throw the original error
            throw error
          }
        } else {
          throw error
        }
      } else {
        throw error
      }
    }
    
    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json({ 
      error: 'Failed to create time entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

