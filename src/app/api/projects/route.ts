import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing.'
      }, { status: 500 })
    }

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
    console.error('Error fetching projects:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing.'
      }, { status: 500 })
    }

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
    
    // Build project data with proper defaults
    const projectData: any = {
      name: body.name.trim(),
      clientId: body.clientId.trim(),
      projectTypeId: body.projectTypeId.trim(),
      budget: budget,
      description: body.description && body.description.trim() ? body.description.trim() : null,
      status: body.status || 'active',
      billingType: body.billingType || 'fixed'
    }

    // Add hourly rate (nullable)
    if (body.hourlyRate !== undefined && body.hourlyRate !== null && body.hourlyRate !== '') {
      const hourlyRate = parseFloat(body.hourlyRate)
      if (!isNaN(hourlyRate) && hourlyRate >= 0) {
        projectData.hourlyRate = hourlyRate
      } else {
        projectData.hourlyRate = null
      }
    } else {
      projectData.hourlyRate = null
    }

    const project = await prisma.project.create({
      data: projectData,
      include: {
        client: true,
        projectType: true
      }
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Full error:', error)
    console.error('Error stack:', errorStack)
    
    // Check for Prisma-specific errors
    if (error instanceof Error) {
      // Foreign key constraint errors
      if (error.message.includes('Foreign key constraint') || error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Validation error',
          details: 'Invalid client or project type selected. Please ensure they exist.'
        }, { status: 400 })
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
      error: 'Failed to create project',
      details: errorMessage
    }, { status: 500 })
  }
}


