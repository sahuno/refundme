import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface AdminProfile {
  role: 'administrator' | 'accountant' | 'student'
  is_super_admin: boolean
  admin_department: string | null
}

export async function checkAdminAccess(): Promise<{ user: User; profile: AdminProfile }> {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Get the user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_super_admin, admin_department')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  // Check if user has admin role or is super admin
  if (profile.role !== 'administrator' && profile.role !== 'accountant' && !profile.is_super_admin) {
    redirect('/dashboard')
  }

  return { user, profile: profile as AdminProfile }
}

export async function checkSuperAdminAccess(): Promise<{ user: User; profile: { is_super_admin: boolean } }> {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Get the user's profile to check super admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_super_admin) {
    redirect('/admin/dashboard')
  }

  return { user, profile }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_super_admin')
    .eq('id', userId)
    .single()

  return profile?.role === 'administrator' || profile?.role === 'accountant' || profile?.is_super_admin === true
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single()
  
  return profile?.is_super_admin === true
}

export async function getAdminDepartment(userId: string): Promise<string | null> {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_department, is_super_admin')
    .eq('id', userId)
    .single()
  
  // Super admin has access to all departments
  if (profile?.is_super_admin) return null
  
  return profile?.admin_department || null
}