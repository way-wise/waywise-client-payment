import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    // Try updating with new fields first, fallback to base data if columns don't exist
    let timeEntry
    const hasNewFields = entryHour !== null || entryMinute !== null
    
    try {
      timeEntry = await prisma.timeEntry.update({
        where: { id },
        data: hasNewFields ? dataWithNewFields : baseData,
        include: {
          project: true,
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
          console.warn('New columns not found, updating entry without entryHour/entryMinute. Error:', error?.message)
          try {
            timeEntry = await prisma.timeEntry.update({
              where: { id },
              data: baseData,
              include: {
                project: true,
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
    console.error('Error updating time entry:', error)
    return NextResponse.json({ 
      error: 'Failed to update time entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.timeEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 })
  }
}

