import { NextRequest, NextResponse } from 'next/server'

/**
 * Returns the validated origin for CORS headers, or null if the origin is not allowed.
 * In production, only origins listed in ALLOWED_MOBILE_ORIGINS are permitted.
 * In development, localhost and 127.0.0.1 origins are allowed.
 */
export function getAllowedOrigin(request: NextRequest | Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_MOBILE_ORIGINS?.split(',') || []
    return allowedOrigins.includes(origin) ? origin : null
  }

  // Development: allow localhost
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin
  }

  return null
}

/**
 * Creates a CORS preflight response with validated origin.
 */
export function corsOptionsResponse(request: NextRequest | Request, methods: string): NextResponse {
  const origin = getAllowedOrigin(request)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': `${methods}, OPTIONS`,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return new NextResponse(null, { status: 200, headers })
}
