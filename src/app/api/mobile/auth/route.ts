import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { email, password, action, fullName } = await request.json();
  
  // Create a Supabase client without cookies for mobile
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  try {
    if (action === 'signin') {
      // Mobile auth attempt
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Auth error occurred
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      
      // Auth successful
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) {
        // Profile fetch error
      }
      
      const response = {
        user: data.user,
        session: data.session,
        profile: profile || null,
      };
      
      // Sending response
      
      return NextResponse.json(response);
    } else if (action === 'signup') {
      // Handle signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      // Wait a moment for trigger to create profile, then fetch it
      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        return NextResponse.json({ 
          user: data.user,
          session: data.session,
          profile: profile || null,
          message: 'Check your email to confirm your account.'
        });
      }
      
      return NextResponse.json({ user: data.user });
    }
    
    // Invalid action
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    // Mobile auth error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}