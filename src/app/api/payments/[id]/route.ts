import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { milestone: true }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    await prisma.payment.delete({ where: { id } })

    // Update milestone status
    const milestone = await prisma.milestone.findUnique({
      where: { id: payment.milestoneId },
      include: { payments: true }
    })

    if (milestone) {
      const totalPaid = milestone.payments.reduce((sum, p) => sum + p.amount, 0)
      const newStatus = totalPaid >= milestone.amount ? 'paid' : 
                       new Date() > milestone.dueDate ? 'overdue' : 'pending'
      
      await prisma.milestone.update({
        where: { id: payment.milestoneId },
        data: { status: newStatus }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}


