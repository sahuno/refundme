'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { ReceiptUpload } from '@/components/receipt/ReceiptUpload'

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

interface ReceiptData {
  merchant_name: string
  total_amount: number
  date: string
  items: Array<{
    description: string
    amount: number
    category: string
  }>
  tax_amount?: number
  receipt_confidence: number
}

function NewRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [txItems, setTxItems] = useState<TransactionItem[]>([])
  const [editingCategory, setEditingCategory] = useState<{ id: string; category: string } | null>(null)
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
  const [selectedManualIndices, setSelectedManualIndices] = useState<Set<number>>(new Set())
  const [manualItems, setManualItems] = useState<ManualItem[]>([])
  const [manual, setManual] = useState<ManualItem>({ description: '', amount: 0, date: '', category: '' })
  
  // Predefined categories for expense items
  const expenseCategories = [
    'Books & Educational Materials',
    'Research Supplies & Equipment', 
    'Academic Software & Technology',
    'Conference Fees & Academic Travel',
    'Office Supplies for Academic Work',
    'Food & Dining',
    'Other'
  ]
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({ open: false, title: '', description: '' })

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

  useEffect(() => {
    async function fetchAdminEmail() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_email')
        .eq('id', user.id)
        .single()
      if (profile?.admin_email) {
        setAdminEmail(profile.admin_email)
      } else {
        setAdminEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@university.edu')
      }
    }
    fetchAdminEmail()
  }, [supabase])

  const handleAddManual = () => {
    if (!manual.description || !manual.amount || !manual.date || !manual.category) return
    setManualItems((prev) => [...prev, manual])
    setManual({ description: '', amount: 0, date: '', category: '' })
  }

  const handleReceiptAnalyzed = (receiptData: ReceiptData) => {
    // Add all receipt items to manual items
    const newItems = receiptData.items.map(item => ({
      description: `${receiptData.merchant_name} - ${item.description}`,
      amount: item.amount,
      date: receiptData.date,
      category: item.category
    }))
    
    setManualItems((prev) => [...prev, ...newItems])
    
    setToast({
      open: true,
      title: 'Receipt Items Added!',
      description: `Added ${newItems.length} items from ${receiptData.merchant_name} (${receiptData.receipt_confidence}% confidence)`
    })
  }

  const total = [...txItems, ...manualItems].reduce((sum, item) => sum + Number(item.amount), 0)

  const handleSaveDraft = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setToast({ open: true, title: 'Error', description: 'User not found. Please log in again.' })
      return
    }
    // 1. Create request
    const { data: req, error: reqError } = await supabase
      .from('reimbursement_requests')
      .insert({ user_id: user.id, status: 'draft', total_amount: total, notes })
      .select()
      .single()
    if (reqError) {
      setLoading(false)
      setToast({ open: true, title: 'Error', description: 'Error saving request.' })
      return
    }
    // 2. Create items
    const items = [
      ...txItems.map((t) => ({
        request_id: req.id,
        transaction_id: t.id,
        amount: t.amount,
        category: t.category || 'Other',
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
    console.log('Creating items:', items)
    const { error: itemsError } = await supabase.from('reimbursement_items').insert(items)
    setLoading(false)
    if (itemsError) {
      console.error('Error saving items:', itemsError)
      setToast({ open: true, title: 'Error', description: `Error saving items: ${itemsError.message}` })
      return
    }
    router.push('/dashboard/requests')
  }

  const handleProceedToSubmit = () => {
    if (total === 0) {
      setToast({ open: true, title: 'Error', description: 'Please add at least one item to submit.' })
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setLoading(true)
    setShowConfirmDialog(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setToast({ open: true, title: 'Error', description: 'User not found. Please log in again.' })
      return
    }
    
    // 1. Create request
    const { data: req, error: reqError } = await supabase
      .from('reimbursement_requests')
      .insert({ user_id: user.id, status: 'draft', total_amount: total, notes })
      .select()
      .single()
    if (reqError) {
      setLoading(false)
      setToast({ open: true, title: 'Error', description: 'Error creating request.' })
      return
    }
    
    // 2. Create items
    const items = [
      ...txItems.map((t) => ({
        request_id: req.id,
        transaction_id: t.id,
        amount: t.amount,
        category: t.category || 'Other',
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
    console.log('Creating items:', items)
    const { error: itemsError } = await supabase.from('reimbursement_items').insert(items)
    if (itemsError) {
      setLoading(false)
      console.error('Error saving items:', itemsError)
      setToast({ open: true, title: 'Error', description: `Error saving items: ${itemsError.message}` })
      return
    }
    
    // 3. Submit the request
    try {
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: req.id })
      })
      const result = await response.json()
      
      if (result.success) {
        setToast({ 
          open: true, 
          title: 'Request Submitted Successfully!', 
          description: `Your reimbursement request has been sent to ${result.admin_email}` 
        })
        setTimeout(() => router.push('/dashboard/requests'), 2000)
      } else {
        setToast({ open: true, title: 'Submission Error', description: result.error || 'Failed to submit request.' })
      }
    } catch {
      setToast({ open: true, title: 'Network Error', description: 'Failed to submit request. Please try again.' })
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">New Reimbursement Request</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Selected Transactions</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {txItems.length === 0 ? <p className="text-gray-600">No transactions selected.</p> : (
            <>
              {txItems.length > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.size === txItems.length && txItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTxIds(new Set(txItems.map(tx => tx.id)))
                          } else {
                            setSelectedTxIds(new Set())
                          }
                        }}
                        className="mr-2"
                      />
                      Select All
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedTxIds.size} of {txItems.length} selected
                    </span>
                  </div>
                  {selectedTxIds.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const remainingTxs = txItems.filter(tx => !selectedTxIds.has(tx.id))
                        setTxItems(remainingTxs)
                        setSelectedTxIds(new Set())
                        
                        // Update URL with remaining transaction IDs
                        const remainingIds = remainingTxs.map(tx => tx.id).join(',')
                        const newUrl = remainingIds 
                          ? `${window.location.pathname}?tx=${remainingIds}`
                          : window.location.pathname
                        window.history.replaceState({}, '', newUrl)
                      }}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Remove Selected ({selectedTxIds.size})
                    </Button>
                  )}
                </div>
              )}
              <table className="min-w-full text-sm mb-4 bg-white">
              <thead>
                <tr>
                  <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedTxIds.size === txItems.length && txItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTxIds(new Set(txItems.map(tx => tx.id)))
                        } else {
                          setSelectedTxIds(new Set())
                        }
                      }}
                      className="sr-only"
                    />
                  </th>
                  <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Date</th>
                  <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Description</th>
                  <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Amount</th>
                  <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {txItems.map((tx) => (
                  <tr key={tx.id} className={selectedTxIds.has(tx.id) ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.has(tx.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedTxIds)
                          if (e.target.checked) {
                            newSelected.add(tx.id)
                          } else {
                            newSelected.delete(tx.id)
                          }
                          setSelectedTxIds(newSelected)
                        }}
                      />
                    </td>
                    <td className="text-gray-800 px-4 py-2">{tx.date}</td>
                    <td className="text-gray-800 px-4 py-2">{tx.description}</td>
                    <td className="text-gray-800 px-4 py-2">${tx.amount.toFixed(2)}</td>
                    <td className="text-gray-800 px-4 py-2">
                      {editingCategory?.id === tx.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingCategory.category}
                            onChange={(e) => setEditingCategory({ ...editingCategory, category: e.target.value })}
                            className="px-2 py-1 text-xs bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select category...</option>
                            {expenseCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setTxItems(prev => prev.map(item => 
                                item.id === tx.id ? { ...item, category: editingCategory.category } : item
                              ))
                              setEditingCategory(null)
                            }}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {tx.category ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {tx.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No category</span>
                          )}
                          <button
                            onClick={() => setEditingCategory({ id: tx.id, category: tx.category || '' })}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>

      <ReceiptUpload onReceiptAnalyzed={handleReceiptAnalyzed} />

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Manual Entry</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="mb-4">
            <h2 className="font-semibold mb-2 text-gray-900">Add Manual Item</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
              <Input 
                placeholder="Description" 
                value={manual.description} 
                onChange={e => setManual({ ...manual, description: e.target.value })} 
                className="bg-white text-gray-900 border-gray-300" 
              />
              <Input 
                placeholder="Amount" 
                type="number" 
                step="0.01"
                value={manual.amount} 
                onChange={e => setManual({ ...manual, amount: Number(e.target.value) })} 
                className="bg-white text-gray-900 border-gray-300" 
              />
              <Input 
                placeholder="Date" 
                type="date" 
                value={manual.date} 
                onChange={e => setManual({ ...manual, date: e.target.value })} 
                className="bg-white text-gray-900 border-gray-300" 
              />
              <select 
                value={manual.category} 
                onChange={e => setManual({ ...manual, category: e.target.value })}
                className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category...</option>
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Button 
                type="button" 
                onClick={handleAddManual} 
                disabled={!manual.description || !manual.amount || !manual.date || !manual.category}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                Add
              </Button>
            </div>
            {manualItems.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedManualIndices.size === manualItems.length && manualItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedManualIndices(new Set(manualItems.map((_, i) => i)))
                          } else {
                            setSelectedManualIndices(new Set())
                          }
                        }}
                        className="mr-2"
                      />
                      Select All Manual Items
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedManualIndices.size} of {manualItems.length} selected
                    </span>
                  </div>
                  {selectedManualIndices.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const remainingItems = manualItems.filter((_, i) => !selectedManualIndices.has(i))
                        setManualItems(remainingItems)
                        setSelectedManualIndices(new Set())
                      }}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Remove Selected ({selectedManualIndices.size})
                    </Button>
                  )}
                </div>
                <table className="min-w-full text-sm bg-white">
                  <thead>
                    <tr>
                      <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left w-10"></th>
                    <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Date</th>
                    <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Description</th>
                    <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Amount</th>
                    <th className="text-gray-900 bg-gray-50 px-4 py-2 text-left">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {manualItems.map((item, i) => (
                    <tr key={i} className={selectedManualIndices.has(i) ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedManualIndices.has(i)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedManualIndices)
                            if (e.target.checked) {
                              newSelected.add(i)
                            } else {
                              newSelected.delete(i)
                            }
                            setSelectedManualIndices(newSelected)
                          }}
                        />
                      </td>
                      <td className="text-gray-800 px-4 py-2">{item.date}</td>
                      <td className="text-gray-800 px-4 py-2">{item.description}</td>
                      <td className="text-gray-800 px-4 py-2">${item.amount.toFixed(2)}</td>
                      <td className="text-gray-800 px-4 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </>
            )}
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1 text-gray-900">Notes</label>
            <Input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="bg-white text-gray-900 border-gray-300" />
          </div>
          <div className="mb-4 font-bold text-gray-900 text-lg">Total: ${total.toFixed(2)}</div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft} 
              disabled={loading}
              className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              onClick={handleProceedToSubmit} 
              disabled={loading || total === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Proceed to Submit
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Confirm Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <p className="text-gray-800">Are you sure you want to submit this reimbursement request?</p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-sm font-medium text-gray-900">Request Details:</p>
                <p className="text-sm text-gray-800">Total Amount: <strong>${total.toFixed(2)}</strong></p>
                <p className="text-sm text-gray-800">Items: <strong>{txItems.length + manualItems.length}</strong></p>
                <p className="text-sm text-gray-800">Will be sent to: <strong>{adminEmail}</strong></p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={loading}
                  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Submitting...' : 'Confirm Submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Toast open={toast.open} onOpenChange={o => setToast(t => ({ ...t, open: o }))} title={toast.title} description={toast.description} />
    </div>
  )
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRequestContent />
    </Suspense>
  )
} 