'use client'

import { useState, useEffect } from 'react'
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link'
import { Button } from '@/components/ui/button'

export function PlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debug: Log component mount
  console.log('PlaidLink component mounted')

  // Fetch link token on mount
  useEffect(() => {
    const fetchToken = async () => {
      // Small delay to ensure session is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching Plaid link token...')
        const response = await fetch('/api/plaid/create-link-token', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Ensure cookies are sent
        })
        console.log('Link token response status:', response.status)
        
        const data = await response.json()
        console.log('Link token response data:', data)
        
        if (!response.ok) {
          console.error('Link token error:', data)
          
          // Check for specific error conditions
          if (response.status === 500 && data.error?.includes('Missing Plaid credentials')) {
            setError('Bank connection is not configured. Please contact support.')
          } else if (response.status === 401) {
            setError('Please log in to connect your bank account.')
          } else {
            setError(data.error || 'Failed to initialize bank connection')
          }
          
          throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
        }
        
        if (!data.linkToken) {
          console.error('No link token in response:', data)
          setError('Failed to get connection token')
          return
        }
        
        console.log('Link token received successfully')
        setLinkToken(data.linkToken)
      } catch (error) {
        console.error('Failed to fetch link token:', error)
        if (!error) {
          setError('Network error - please try again')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchToken()
  }, [])

  console.log('PlaidLink state:', { linkToken: !!linkToken, loading })
  
  const config = linkToken ? {
    token: linkToken,
    onSuccess: ((public_token, metadata) => {
      const handleSuccess = async () => {
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
      }
      handleSuccess()
    }) as PlaidLinkOnSuccess,
    onExit: ((err, metadata) => {
      if (err) {
        console.error('Plaid Link error:', err)
      }
      console.log('Plaid Link exit:', metadata)
    }) as PlaidLinkOnExit,
  } : null
  
  const { open, ready, error: plaidError } = usePlaidLink(config || {
    token: '',
    onSuccess: (() => {}) as PlaidLinkOnSuccess,
  })

  // Log any Plaid SDK errors
  useEffect(() => {
    if (plaidError) {
      console.error('Plaid SDK error:', plaidError)
    }
  }, [plaidError])

  // Log ready state changes
  useEffect(() => {
    console.log('Plaid Link ready state changed:', ready)
    if (ready && linkToken) {
      console.log('Plaid Link is ready to open')
    }
  }, [ready, linkToken])

  const getButtonText = () => {
    if (loading) return 'Loading...'
    if (!linkToken) return 'Setting up...'
    if (!ready) return 'Preparing...'
    return 'Connect a Bank Account'
  }

  const isDisabled = !ready || loading || !linkToken

  return (
    <div className="space-y-2">
      <Button
        onClick={() => {
          console.log('Connect button clicked - Ready:', ready, 'Token:', !!linkToken)
          if (ready && linkToken) {
            open()
          } else if (error) {
            // If there's an error, try fetching again
            window.location.reload()
          }
        }}
        disabled={isDisabled && !error}
        className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
      >
        {error ? 'Retry Connection' : getButtonText()}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 