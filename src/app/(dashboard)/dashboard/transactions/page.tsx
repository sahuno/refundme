'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { TransactionAnalyzer } from '@/components/ai/TransactionAnalyzer'

interface Transaction {
  id: string
  date: string
  description: string
  merchant_name: string | null
  amount: number
  category: string | null
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
      if (!error && data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [supabase])

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCreateRequest = () => {
    router.push(`/dashboard/requests/new?tx=${selected.join(',')}`)
  }

  const handleAISelection = (eligibleTransactions: Transaction[]) => {
    const ids = eligibleTransactions.map(t => t.id)
    setSelected(ids)
    setShowAIAnalyzer(false)
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 min-h-screen p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="space-x-2">
          <Button
            onClick={() => setShowAIAnalyzer(!showAIAnalyzer)}
            variant="outline"
            disabled={transactions.length === 0}
            className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
          >
            🤖 AI Analysis
          </Button>
          {selected.length > 0 && (
            <Button 
              onClick={handleCreateRequest}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Request ({selected.length})
            </Button>
          )}
        </div>
      </div>

      {showAIAnalyzer && (
        <TransactionAnalyzer
          transactions={transactions}
          onEligibleSelected={handleAISelection}
        />
      )}

      <Card className="bg-white text-gray-900 shadow">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th></th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Merchant</th>
                  <th className="text-left">Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(tx.id)}
                        onChange={() => handleSelect(tx.id)}
                      />
                    </td>
                    <td>{tx.date}</td>
                    <td>{tx.description}</td>
                    <td>{tx.merchant_name}</td>
                    <td>{tx.category}</td>
                    <td className="text-right">${tx.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 