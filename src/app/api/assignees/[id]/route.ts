import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const assignee = await prisma.assignee.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone
      }
    })
    return NextResponse.json(assignee)
  } catch (error) {
    console.error('Error updating assignee:', error)
    return NextResponse.json({ error: 'Failed to update assignee' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.assignee.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignee:', error)
    return NextResponse.json({ error: 'Failed to delete assignee' }, { status: 500 })
  }
}

