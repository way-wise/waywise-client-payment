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

    const assignees = await prisma.assignee.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(assignees)
  } catch (error) {
    console.error('Error fetching assignees:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch assignees',
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
    const assignee = await prisma.assignee.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone
      }
    })
    return NextResponse.json(assignee)
  } catch (error) {
    console.error('Error creating assignee:', error)
    return NextResponse.json({ 
      error: 'Failed to create assignee',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

