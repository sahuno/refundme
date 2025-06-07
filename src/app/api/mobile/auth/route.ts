import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { email, password, action } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      return NextResponse.json({
        user: data.user,
        session: data.session,
        profile,
      });
    } else if (action === 'signup') {
      // Handle signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({ user: data.user });
    }
  } catch (err) {
    console.error('Mobile auth error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}