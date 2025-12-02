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
    
    console.log('Updating project:', id, 'with data:', body)
    
    // Build project data - only include fields that are provided
    const projectData: {
      name: string
      clientId: string
      projectTypeId: string
      budget: number
      description: string | null
      status: string
      billingType?: string
      hourlyRate?: number | null
    } = {
      name: body.name,
      clientId: body.clientId,
      projectTypeId: body.projectTypeId,
      budget: parseFloat(body.budget),
      description: body.description || null,
      status: body.status || 'active'
    }

    // Only add billingType if it exists in the request, otherwise use default
    if (body.billingType !== undefined && body.billingType !== null) {
      projectData.billingType = body.billingType
    } else if (body.billingType === undefined) {
      // Only set default if not provided at all
      projectData.billingType = 'fixed'
    }

    // Handle hourly rate
    if (body.hourlyRate !== undefined) {
      if (body.hourlyRate === null || body.hourlyRate === '') {
        projectData.hourlyRate = null
      } else {
        const rate = parseFloat(body.hourlyRate)
        if (!isNaN(rate)) {
          projectData.hourlyRate = rate
        } else {
          projectData.hourlyRate = null
        }
      }
    }

    console.log('Project data to update:', projectData)

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    return NextResponse.json({ 
      error: 'Failed to update project',
      details: errorMessage
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
  } catch (err) {
    console.error('Error deleting project:', err)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}


