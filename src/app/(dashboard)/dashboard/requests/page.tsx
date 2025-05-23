'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReimbursementPdfDocument } from '@/components/pdf/ReimbursementPdfDocument'

interface Request {
  id: string
  created_at: string
  total_amount: number
  status: string
  student_name: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true)
      const { data, error } = await supabase
        .from('reimbursement_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setRequests(data)
      setLoading(false)
    }
    fetchRequests()
  }, [supabase])

  const handleSubmit = async (id: string) => {
    await supabase
      .from('reimbursement_requests')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', id)
    window.location.reload()
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
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                          onClick={() => handleSubmit(req.id)}
                        >
                          Submit
                        </button>
                      )}
                      <PDFDownloadLink
                        document={<ReimbursementPdfDocument request={req} items={[]} />}
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
    </div>
  )
} 