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
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: 'Project name is required'
      }, { status: 400 })
    }

    if (!body.clientId || !body.clientId.trim()) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: 'Client is required'
      }, { status: 400 })
    }

    if (!body.projectTypeId || !body.projectTypeId.trim()) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: 'Project type is required'
      }, { status: 400 })
    }

    if (!body.budget || body.budget === '' || isNaN(parseFloat(body.budget))) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: 'Valid budget amount is required'
      }, { status: 400 })
    }

    const budget = parseFloat(body.budget)
    if (budget < 0) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: 'Budget must be a positive number'
      }, { status: 400 })
    }
    
    // Build project data
    const projectData: {
      name: string
      clientId: string
      projectTypeId: string
      budget: number
      description: string | null
      status: string
      billingType: string
      hourlyRate: number | null
    } = {
      name: body.name.trim(),
      clientId: body.clientId.trim(),
      projectTypeId: body.projectTypeId.trim(),
      budget: budget,
      description: body.description && body.description.trim() ? body.description.trim() : null,
      status: body.status || 'active',
      billingType: body.billingType || 'fixed',
      hourlyRate: null
    }

    // Handle hourly rate
    if (body.hourlyRate !== undefined && body.hourlyRate !== null && body.hourlyRate !== '') {
      const rate = parseFloat(body.hourlyRate)
      if (!isNaN(rate) && rate >= 0) {
        projectData.hourlyRate = rate
      }
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    
    // Check for Prisma-specific errors
    if (error instanceof Error) {
      // Foreign key constraint errors
      if (error.message.includes('Foreign key constraint') || error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Validation error',
          details: 'Invalid client or project type selected. Please ensure they exist.'
        }, { status: 400 })
      }
      
      // Record not found
      if (error.message.includes('Record to update does not exist') || error.message.includes('not found')) {
        return NextResponse.json({ 
          error: 'Project not found',
          details: 'The project you are trying to update does not exist.'
        }, { status: 404 })
      }
      
      // Connection errors
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Database connection error',
          details: 'Unable to connect to the database. Please check your connection settings.'
        }, { status: 500 })
      }
    }
    
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


