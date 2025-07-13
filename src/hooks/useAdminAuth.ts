'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  [key: string]: unknown
}

interface AdminAuthState {
  isAdmin: boolean
  isLoading: boolean
  user: User | null
  profile: Profile | null
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    user: null,
    profile: null
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let lastActivity = Date.now()
    const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

    async function checkAdminStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const isAdmin = profile?.role === 'administrator' || profile?.role === 'accountant'
        
        if (!isAdmin) {
          router.push('/dashboard')
          return
        }

        setState({
          isAdmin: true,
          isLoading: false,
          user,
          profile
        })

        // Start session timeout check
        checkSessionTimeout()
      } catch (error) {
        console.error('Admin auth check failed:', error)
        router.push('/dashboard')
      }
    }

    function checkSessionTimeout() {
      const now = Date.now()
      if (now - lastActivity > SESSION_TIMEOUT) {
        // Session expired
        supabase.auth.signOut()
        router.push('/login?session_expired=true')
        return
      }
      
      // Check again in 1 minute
      timeoutId = setTimeout(checkSessionTimeout, 60000)
    }

    function resetActivity() {
      lastActivity = Date.now()
    }

    // Listen for user activity
    window.addEventListener('mousemove', resetActivity)
    window.addEventListener('keydown', resetActivity)
    window.addEventListener('click', resetActivity)

    checkAdminStatus()

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', resetActivity)
      window.removeEventListener('keydown', resetActivity)
      window.removeEventListener('click', resetActivity)
    }
  }, [router, supabase])

  return state
}