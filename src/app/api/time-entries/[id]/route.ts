import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        projectId: body.projectId,
        assigneeId: body.assigneeId,
        date: new Date(body.date),
        hours: parseFloat(body.hours),
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

