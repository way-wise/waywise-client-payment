import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        status: 'error',
        message: 'DATABASE_URL is not configured',
        database: 'not_configured'
      }, { status: 500 })
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Database connection successful',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Database health check failed:', error)
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

