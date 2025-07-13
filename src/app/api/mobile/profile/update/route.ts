import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { full_name, department, student_id, admin_email } = body

    // Update profile data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        department,
        student_id,
        admin_email
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      profile: data
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ 
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}

// Add OPTIONS for CORS support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}