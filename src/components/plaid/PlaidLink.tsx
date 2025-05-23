'use client'

import { useState, useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'

export function PlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch link token on mount
  useEffect(() => {
    const fetchToken = async () => {
      setLoading(true)
      const response = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await response.json()
      setLinkToken(data.linkToken)
      setLoading(false)
    }
    fetchToken()
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        setLoading(true)
        await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name,
          }),
        })
        window.location.reload()
      } catch (error) {
        console.error('Error exchanging token:', error)
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || loading || !linkToken}
    >
      {loading ? 'Loading...' : 'Connect a Bank Account'}
    </Button>
  )
} 