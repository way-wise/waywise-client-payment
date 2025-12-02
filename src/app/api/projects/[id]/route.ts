import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectType: true,
        milestones: {
          include: {
            payments: true
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing.'
      }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const projectData: any = {
      name: body.name,
      clientId: body.clientId,
      projectTypeId: body.projectTypeId,
      budget: parseFloat(body.budget),
      description: body.description,
      status: body.status,
      billingType: body.billingType || 'fixed',
      hourlyRate: body.hourlyRate && body.hourlyRate !== '' ? parseFloat(body.hourlyRate) : null
    }

    const project = await prisma.project.update({
      where: { id },
      data: projectData,
      include: {
        client: true,
        projectType: true
      }
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ 
      error: 'Failed to update project',
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
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}


