import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return { user, supabase }
}

export async function requireAdminAuth() {
  const authResult = await requireAuth()
  
  if ('status' in authResult) {
    return authResult
  }
  
  const { user, supabase } = authResult
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_super_admin, admin_department')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['administrator', 'accountant'].includes(profile.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
  
  return { user, profile, supabase }
}