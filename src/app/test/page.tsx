'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    testConnection()
  }, [supabase])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Connection Test</h1>
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        {error && (
          <div className="text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div>
          <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </div>
      </div>
    </div>
  )
} 