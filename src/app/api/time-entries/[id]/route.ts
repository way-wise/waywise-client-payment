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
    if (body.entryHour !== undefined && body.entryMinute !== undefined) {
      calculatedHours = (parseInt(body.entryHour) || 0) + ((parseInt(body.entryMinute) || 0) / 60)
    }
    
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        projectId: body.projectId,
        assigneeId: body.assigneeId,
        date: new Date(body.date),
        hours: calculatedHours,
        entryHour: body.entryHour !== undefined ? parseInt(body.entryHour) : null,
        entryMinute: body.entryMinute !== undefined ? parseInt(body.entryMinute) : null,
        description: body.description
      },
      include: {
        project: true,
        assignee: true
      }
    })
    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 })
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

