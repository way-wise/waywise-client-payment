import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const milestones = await prisma.milestone.findMany({
      where: {
        OR: [
          { status: 'overdue' },
          {
            status: 'pending',
            dueDate: { lt: now }
          }
        ]
      },
      include: {
        project: {
          include: {
            client: true,
            projectType: true
          }
        },
        payments: true
      },
      orderBy: { dueDate: 'asc' }
    })

    const overdue = milestones.map((milestone: typeof milestones[0]) => {
      const totalPaid = milestone.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
      const remaining = milestone.amount - totalPaid
      return {
        ...milestone,
        totalPaid,
        remaining
      }
    })

    return NextResponse.json(overdue)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch overdue payments' }, { status: 500 })
  }
}


