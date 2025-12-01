import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        name: body.name,
        amount: parseFloat(body.amount),
        dueDate: new Date(body.dueDate),
        description: body.description,
        status: body.status
      }
    })
    return NextResponse.json(milestone)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.milestone.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  }
}


