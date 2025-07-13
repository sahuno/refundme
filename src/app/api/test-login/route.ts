import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Temporary endpoint to test if we can login without rate limit
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Add a small delay to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.status,
        details: error
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true,
      user: data.user,
      session: data.session 
    });
  } catch (err) {
    console.error('Test login error:', err);
    return NextResponse.json(
      { error: 'Internal error', details: err },
      { status: 500 }
    );
  }
}