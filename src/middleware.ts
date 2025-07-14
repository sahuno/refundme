import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Add security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Strict CSP for production
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plaid.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://*.supabase.co https://api.plaid.com https://cdn.plaid.com wss://*.supabase.co; " +
      "frame-src 'self' https://cdn.plaid.com;"
    )
  }
  
  // Add CORS headers for mobile API with strict origin control
  if (req.nextUrl.pathname.startsWith('/api/mobile')) {
    const allowedOrigins = process.env.ALLOWED_MOBILE_ORIGINS?.split(',') || [];
    const origin = req.headers.get('origin');
    
    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production') {
      if (origin && allowedOrigins.includes(origin)) {
        res.headers.set('Access-Control-Allow-Origin', origin);
      }
    } else {
      // Development only - still restrict to localhost
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        res.headers.set('Access-Control-Allow-Origin', origin);
      }
    }
    
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: res.headers });
    }
    
    return res;
  }
  
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Log authentication state in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware:', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      sessionUser: session?.user?.email
    })
  }

  // List of public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/auth/callback', '/']
  
  // In production, block all test endpoints
  if (process.env.NODE_ENV === 'production' && 
      (req.nextUrl.pathname.startsWith('/api/test') || 
       req.nextUrl.pathname === '/test')) {
    return new Response('Not Found', { status: 404 })
  }
  
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname) || 
                       req.nextUrl.pathname.startsWith('/api/auth/') ||
                       req.nextUrl.pathname.startsWith('/_next/') ||
                       req.nextUrl.pathname.startsWith('/favicon.ico')

  // CRITICAL: Block all dashboard and admin routes without authentication
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                          req.nextUrl.pathname.startsWith('/admin')

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is not signed in and the current path is not public
  // redirect the user to /login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is signed in and the current path is /login or /register
  // redirect the user to /dashboard
  if (session && ['/login', '/register'].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}