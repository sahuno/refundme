'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReimbursementPdfDocument } from '@/components/pdf/ReimbursementPdfDocument'

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
          const { data: items } = await supabase
            .from('reimbursement_items')
            .select('*')
            .eq('request_id', request.id)
          
          if (items) {
            itemsMap[request.id] = items
          }
        }
        setRequestItems(itemsMap)
      }
      setLoading(false)
    }
    fetchRequests()
  }, [supabase])

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
        setToast({
          open: true,
          title: 'Request Submitted!',
          description: result.email_sent 
            ? 'Your request has been submitted and admin notified via email.'
            : 'Your request has been submitted successfully.'
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
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>${req.total_amount.toFixed(2)}</td>
                    <td>{req.status}</td>
                    <td>
                      {req.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(req.id)}
                          disabled={submitting === req.id}
                          className="mr-2"
                        >
                          {submitting === req.id ? 'Submitting...' : 'Submit'}
                        </Button>
                      )}
                      <PDFDownloadLink
                        document={<ReimbursementPdfDocument request={req} items={requestItems[req.id] || []} />}
                        fileName={`reimbursement-request-${req.id}.pdf`}
                      >
                        {({ loading }) => loading ? 'Generating...' : 'Generate PDF'}
                      </PDFDownloadLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <Toast 
        open={toast.open} 
        onOpenChange={(open) => setToast(t => ({ ...t, open }))} 
        title={toast.title} 
        description={toast.description} 
      />
    </div>
  )
} 