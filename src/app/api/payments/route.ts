import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        milestone: {
          include: {
            project: {
              include: {
                client: true
              }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    })
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payment = await prisma.payment.create({
      data: {
        milestoneId: body.milestoneId,
        amount: parseFloat(body.amount),
        paymentDate: new Date(body.paymentDate || Date.now()),
        notes: body.notes
      },
      include: {
        milestone: {
          include: {
            project: {
              include: {
                client: true
              }
            },
            payments: true
          }
        }
      }
    })

    // Update milestone status based on total payments
    const milestone = await prisma.milestone.findUnique({
      where: { id: body.milestoneId },
      include: { payments: true }
    })

    if (milestone) {
      const totalPaid = milestone.payments.reduce((sum, p) => sum + p.amount, 0)
      const newStatus = totalPaid >= milestone.amount ? 'paid' : 
                       new Date() > milestone.dueDate ? 'overdue' : 'pending'
      
      await prisma.milestone.update({
        where: { id: body.milestoneId },
        data: { status: newStatus }
      })
    }

    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}


