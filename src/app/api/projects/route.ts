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
    
    // Build project data with proper defaults
    const projectData: any = {
      name: body.name,
      clientId: body.clientId,
      projectTypeId: body.projectTypeId,
      budget: parseFloat(body.budget),
      description: body.description || null,
      status: body.status || 'active'
    }

    // Add billing type (with default)
    if (body.billingType) {
      projectData.billingType = body.billingType
    } else {
      projectData.billingType = 'fixed'
    }

    // Add hourly rate (nullable)
    if (body.hourlyRate !== undefined && body.hourlyRate !== null && body.hourlyRate !== '') {
      projectData.hourlyRate = parseFloat(body.hourlyRate)
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
    console.error('Full error:', error)
    return NextResponse.json({ 
      error: 'Failed to create project',
      details: errorMessage
    }, { status: 500 })
  }
}


