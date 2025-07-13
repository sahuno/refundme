'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReimbursementPdfDocument } from '@/components/pdf/ReimbursementPdfDocument'
import Link from 'next/link'

interface Request {
  id: string
  created_at: string
  total_amount: number
  status: string
  student_name: string
  notes?: string
}

interface RequestItem {
  id: string
  date: string
  description: string
  category: string
  amount: number
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [requestItems, setRequestItems] = useState<Record<string, RequestItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({ open: false, title: '', description: '' })
  const supabase = createClient()

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile for student name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Fetch requests with student name
      const { data: requestsData, error } = await supabase
        .from('reimbursement_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && requestsData) {
        const requestsWithName = requestsData.map(req => ({
          ...req,
          student_name: profile?.full_name || 'Unknown Student'
        }))
        setRequests(requestsWithName)

        // Fetch items for each request
        const itemsMap: Record<string, RequestItem[]> = {}
        for (const request of requestsData) {
          const { data: items, error: itemsError } = await supabase
            .from('reimbursement_items')
            .select('*')
            .eq('request_id', request.id)
          
          if (itemsError) {
            console.error(`Error fetching items for request ${request.id}:`, itemsError)
          } else if (items) {
            console.log(`Found ${items.length} items for request ${request.id}`)
            itemsMap[request.id] = items
          }
        }
        setRequestItems(itemsMap)
      }
      setLoading(false)
    }
    fetchRequests()
  }, [supabase])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setToast({
          open: true,
          title: 'Request Deleted',
          description: 'The draft request has been deleted successfully.'
        })
        
        // Remove from local state
        setRequests(prev => prev.filter(req => req.id !== id))
        const newRequestItems = { ...requestItems }
        delete newRequestItems[id]
        setRequestItems(newRequestItems)
      } else {
        const result = await response.json()
        setToast({
          open: true,
          title: 'Delete Failed',
          description: result.error || 'Failed to delete request'
        })
      }
    } catch {
      setToast({
        open: true,
        title: 'Error',
        description: 'Network error occurred while deleting request'
      })
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const handleSubmit = async (id: string) => {
    setSubmitting(id)
    try {
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: id }),
      })

      const result = await response.json()

      if (response.ok) {
        let description = 'Your request has been submitted successfully.'
        if (result.email_sent) {
          description = result.using_custom_admin 
            ? `Your request has been submitted and your department admin (${result.admin_email}) has been notified via email.`
            : 'Your request has been submitted and the system admin has been notified via email.'
        }
        
        setToast({
          open: true,
          title: 'Request Submitted!',
          description
        })
        
        // Refresh the requests
        window.location.reload()
      } else {
        setToast({
          open: true,
          title: 'Submission Failed',
          description: result.error || 'Failed to submit request'
        })
      }
    } catch {
      setToast({
        open: true,
        title: 'Error',
        description: 'Network error occurred while submitting request'
      })
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold">Reimbursement Requests</h1>
      <Card className="bg-white text-gray-900 shadow">
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p>No requests found.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="bg-gray-50 border border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-900">
                          Request #{req.id.slice(0, 8)}...
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(req.created_at).toLocaleDateString()} • 
                          Total: ${req.total_amount.toFixed(2)} • 
                          Status: <span className={`font-medium ${req.status === 'submitted' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {req.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {req.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSubmit(req.id)}
                              disabled={submitting === req.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {submitting === req.id ? 'Submitting...' : 'Submit'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDelete(req.id)}
                              disabled={deleting === req.id}
                              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            >
                              {deleting === req.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </>
                        )}
                        {req.status !== 'draft' && (
                          <Link href={`/dashboard/requests/${req.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                        )}
                        <PDFDownloadLink
                          document={<ReimbursementPdfDocument request={req} items={requestItems[req.id] || []} />}
                          fileName={`reimbursement-request-${req.id}.pdf`}
                        >
                          {({ loading }) => (
                            <Button size="sm" variant="outline" disabled={loading}>
                              {loading ? 'Generating...' : 'Download PDF'}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {req.notes && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-gray-700"><strong>Notes:</strong> {req.notes}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Expense Items:</h4>
                      {(requestItems[req.id] || []).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No items found for this request.</p>
                      ) : (
                        <div className="bg-white rounded border">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="text-left p-3 font-medium text-gray-900">Date</th>
                                <th className="text-left p-3 font-medium text-gray-900">Description</th>
                                <th className="text-left p-3 font-medium text-gray-900">Category</th>
                                <th className="text-left p-3 font-medium text-gray-900">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(requestItems[req.id] || []).map((item, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                  <td className="p-3 text-gray-800">{item.date}</td>
                                  <td className="p-3 text-gray-800">{item.description}</td>
                                  <td className="p-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-3 text-gray-800 font-medium">${item.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Toast 
        open={toast.open} 
        onOpenChange={(open) => setToast(t => ({ ...t, open }))} 
        title={toast.title} 
        description={toast.description} 
      />
      
      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <p className="text-gray-800">Are you sure you want to delete this draft request?</p>
              <p className="text-sm text-gray-600">This action cannot be undone. All expense items associated with this request will also be deleted.</p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmDelete(null)}
                  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting === confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting === confirmDelete ? 'Deleting...' : 'Delete Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 