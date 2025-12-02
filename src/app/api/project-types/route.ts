import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set in environment variables')
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing. Please configure it in Vercel settings.'
      }, { status: 500 })
    }

    const types = await prisma.projectType.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching project types:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a DATABASE_URL error
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable')) {
      return NextResponse.json({ 
        error: 'Database connection not configured',
        details: 'DATABASE_URL environment variable is missing or invalid. Please configure it in Vercel settings.'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch project types',
      details: errorMessage
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const type = await prisma.projectType.create({
      data: { name: body.name }
    })
    return NextResponse.json(type)
  } catch (error) {
    console.error('Error creating project type:', error)
    return NextResponse.json({ 
      error: 'Failed to create project type',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


