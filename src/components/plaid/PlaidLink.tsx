'use client'

import { useState, useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'

export function PlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Debug: Log component mount
  console.log('PlaidLink component mounted')

  // Fetch link token on mount
  useEffect(() => {
    const fetchToken = async () => {
      setLoading(true)
      try {
        console.log('Fetching Plaid link token...')
        const response = await fetch('/api/plaid/create-link-token', { method: 'POST' })
        console.log('Link token response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Link token error:', errorData)
          
          // Check for specific error conditions
          if (response.status === 500 && errorData.error?.includes('Missing Plaid credentials')) {
            console.error('Plaid is not configured. Please set environment variables.')
            alert('Bank connection is not configured. Please contact support.')
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`)
        }
        
        const data = await response.json()
        console.log('Link token received:', data.linkToken ? 'Success' : 'Failed')
        setLinkToken(data.linkToken)
      } catch (error) {
        console.error('Failed to fetch link token:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchToken()
  }, [])

  console.log('PlaidLink state:', { linkToken: !!linkToken, loading })
  
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        setLoading(true)
        console.log('Exchanging token for institution:', metadata.institution?.name)
        
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name,
          }),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Token exchange error:', errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const result = await response.json()
        console.log('Token exchange result:', result)
        
        window.location.reload()
      } catch (error) {
        console.error('Error exchanging token:', error)
        alert('Failed to connect bank account. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link error:', err)
      }
      console.log('Plaid Link exit:', metadata)
    },
  })

  const getButtonText = () => {
    if (loading) return 'Loading...'
    if (!linkToken) return 'Setting up...'
    if (!ready) return 'Preparing...'
    return 'Connect a Bank Account'
  }

  const isDisabled = !ready || loading || !linkToken

  return (
    <Button
      onClick={() => {
        console.log('Connect button clicked - Ready:', ready, 'Token:', !!linkToken)
        if (ready && linkToken) {
          open()
        }
      }}
      disabled={isDisabled}
      className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
    >
      {getButtonText()}
    </Button>
  )
} 