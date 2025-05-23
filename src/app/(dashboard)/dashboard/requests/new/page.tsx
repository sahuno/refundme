'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toast } from '@/components/ui/toast'

interface TransactionItem {
  id: string
  date: string
  description: string
  amount: number
  category: string | null
}

interface ManualItem {
  description: string
  amount: number
  date: string
  category: string
}

export default function NewRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [txItems, setTxItems] = useState<TransactionItem[]>([])
  const [manualItems, setManualItems] = useState<ManualItem[]>([])
  const [manual, setManual] = useState<ManualItem>({ description: '', amount: 0, date: '', category: '' })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const txIds = searchParams.get('tx')?.split(',').filter(Boolean) || []
    if (txIds.length === 0) return
    async function fetchTxs() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .in('id', txIds)
      if (data) setTxItems(data)
    }
    fetchTxs()
  }, [searchParams, supabase])

  const handleAddManual = () => {
    if (!manual.description || !manual.amount || !manual.date || !manual.category) return
    setManualItems((prev) => [...prev, manual])
    setManual({ description: '', amount: 0, date: '', category: '' })
  }

  const total = [...txItems, ...manualItems].reduce((sum, item) => sum + Number(item.amount), 0)

  const handleSaveDraft = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    // 1. Create request
    const { data: req, error: reqError } = await supabase
      .from('reimbursement_requests')
      .insert({ user_id: user.id, status: 'draft', total_amount: total, notes })
      .select()
      .single()
    if (reqError) {
      setLoading(false)
      alert('Error saving request')
      return
    }
    // 2. Create items
    const items = [
      ...txItems.map((t) => ({
        request_id: req.id,
        transaction_id: t.id,
        amount: t.amount,
        category: t.category || '',
        description: t.description,
        date: t.date,
        is_manual_entry: false,
      })),
      ...manualItems.map((m) => ({
        request_id: req.id,
        transaction_id: null,
        amount: m.amount,
        category: m.category,
        description: m.description,
        date: m.date,
        is_manual_entry: true,
      })),
    ]
    const { error: itemsError } = await supabase.from('reimbursement_items').insert(items)
    setLoading(false)
    if (itemsError) {
      alert('Error saving items')
      return
    }
    router.push('/dashboard/requests')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">New Reimbursement Request</h1>
      <Card>
        <CardHeader>
          <CardTitle>Selected Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txItems.length === 0 ? <p>No transactions selected.</p> : (
            <table className="min-w-full text-sm mb-4">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {txItems.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>{tx.description}</td>
                    <td>${tx.amount.toFixed(2)}</td>
                    <td>{tx.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mb-4">
            <h2 className="font-semibold mb-2">Add Manual Item</h2>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Description" value={manual.description} onChange={e => setManual({ ...manual, description: e.target.value })} />
              <Input placeholder="Amount" type="number" value={manual.amount} onChange={e => setManual({ ...manual, amount: Number(e.target.value) })} />
              <Input placeholder="Date" type="date" value={manual.date} onChange={e => setManual({ ...manual, date: e.target.value })} />
              <Input placeholder="Category" value={manual.category} onChange={e => setManual({ ...manual, category: e.target.value })} />
              <Button type="button" onClick={handleAddManual}>Add</Button>
            </div>
            {manualItems.length > 0 && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {manualItems.map((item, i) => (
                    <tr key={i}>
                      <td>{item.date}</td>
                      <td>{item.description}</td>
                      <td>${item.amount.toFixed(2)}</td>
                      <td>{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Notes</label>
            <Input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="mb-4 font-bold">Total: ${total.toFixed(2)}</div>
          <Button onClick={handleSaveDraft} disabled={loading}>
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 