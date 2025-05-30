'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlaidLink } from '@/components/plaid/PlaidLink'
import { AIFeatureDemo } from '@/components/ai/AIFeatureDemo'

interface Allowance {
  total_amount: number
  used_amount: number
}

interface BankConnection {
  id: string
  institution_name: string
}

export default function DashboardPage() {
  const [allowance, setAllowance] = useState<Allowance | null>(null)
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch allowance
      const { data: allowanceData } = await supabase
        .from('allowances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (allowanceData) {
        setAllowance(allowanceData)
      }

      // Fetch bank connections
      const { data: connectionsData } = await supabase
        .from('bank_connections')
        .select('id, institution_name')
        .eq('user_id', user.id)

      if (connectionsData) {
        setBankConnections(connectionsData)
      }
    }

    fetchData()
  }, [supabase])

  return (
    <div className="space-y-6 bg-white text-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white text-gray-900 shadow">
          <CardHeader>
            <CardTitle>Allowance</CardTitle>
          </CardHeader>
          <CardContent>
            {allowance ? (
              <div className="space-y-2">
                <p>Total: ${allowance.total_amount.toFixed(2)}</p>
                <p>Used: ${allowance.used_amount.toFixed(2)}</p>
                <p>Remaining: ${(allowance.total_amount - allowance.used_amount).toFixed(2)}</p>
              </div>
            ) : (
              <p>No allowance data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white text-gray-900 shadow">
          <CardHeader>
            <CardTitle>Bank Connections</CardTitle>
          </CardHeader>
          <CardContent>
            {bankConnections.length > 0 ? (
              <div className="space-y-2">
                {bankConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between">
                    <span>{connection.institution_name}</span>
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={async () => {
                        await fetch('/api/plaid/sync-transactions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bank_connection_id: connection.id }),
                        })
                        window.location.href = '/dashboard/transactions'
                      }}
                    >
                      Sync Transactions
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No bank connections</p>
            )}
            <div className="mt-4 space-y-2">
              <PlaidLink />
              <button 
                className="ml-2 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={async () => {
                  console.log('Testing link token API...')
                  try {
                    const response = await fetch('/api/plaid/create-link-token', { method: 'POST' })
                    const data = await response.json()
                    console.log('Direct API test result:', data)
                    alert(`API Test: ${response.ok ? 'Success' : 'Failed'} - Check console for details`)
                  } catch (error) {
                    console.error('Direct API test failed:', error)
                    alert('API Test Failed - Check console')
                  }
                }}
              >
                Test API Direct
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AIFeatureDemo />
    </div>
  )
} 