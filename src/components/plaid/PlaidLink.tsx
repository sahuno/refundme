'use client'

import { useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function PlaidLink() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const { open, ready } = usePlaidLink({
    token: null,
    onSuccess: async (public_token, metadata) => {
      try {
        setLoading(true)
        
        // Exchange public token for access token
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to exchange token')
        }

        // Refresh the page to show the new connection
        window.location.reload()
      } catch (error) {
        console.error('Error exchanging token:', error)
      } finally {
        setLoading(false)
      }
    },
  })

  const handleClick = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      })
      const { linkToken } = await response.json()
      open(linkToken)
    } catch (error) {
      console.error('Error creating link token:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={!ready || loading}
    >
      {loading ? 'Loading...' : 'Connect a Bank Account'}
    </Button>
  )
} 