import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const types = await prisma.projectType.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching project types:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch project types',
      details: error instanceof Error ? error.message : 'Unknown error'
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
    return NextResponse.json({ error: 'Failed to create project type' }, { status: 500 })
  }
}


