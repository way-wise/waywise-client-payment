import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const milestones = await prisma.milestone.findMany({
      include: {
        project: {
          include: {
            client: true
          }
        },
        payments: true
      },
      orderBy: { dueDate: 'asc' }
    })
    return NextResponse.json(milestones)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const milestone = await prisma.milestone.create({
      data: {
        name: body.name,
        projectId: body.projectId,
        amount: parseFloat(body.amount),
        dueDate: new Date(body.dueDate),
        description: body.description,
        status: body.status || 'pending'
      },
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    })
    return NextResponse.json(milestone)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  }
}


