import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        projectType: true,
        milestones: {
          include: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const project = await prisma.project.create({
      data: {
        name: body.name,
        clientId: body.clientId,
        projectTypeId: body.projectTypeId,
        budget: parseFloat(body.budget),
        description: body.description,
        status: body.status || 'active'
      },
      include: {
        client: true,
        projectType: true
      }
    })
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}


