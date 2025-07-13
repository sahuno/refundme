import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = createClient()
    
    try {
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        )
      }

      // Check if we have a session now
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Error getting session:', sessionError)
        return NextResponse.redirect(
          new URL('/login?error=Failed to establish session', requestUrl.origin)
        )
      }

      // Successfully confirmed email and logged in
      console.log('User confirmed email and logged in:', session.user.email)
      
      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(
        new URL('/login?error=An unexpected error occurred', requestUrl.origin)
      )
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}