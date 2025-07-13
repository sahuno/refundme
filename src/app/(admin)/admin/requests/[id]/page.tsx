'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { RequestComments } from '@/components/RequestComments'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface RequestDetails {
  id: string
  created_at: string
  total_amount: number
  status: string
  notes: string | null
  admin_notes: string | null
  rejection_reason: string | null
  profiles: {
    full_name: string
    email: string
    department: string | null
    student_id: string | null
  }
  reimbursement_items: Array<{
    id: string
    description: string
    amount: number
    category: string
    date: string
    is_manual_entry: boolean
  }>
  approval_history: Array<{
    id: string
    action: string
    performed_by: string
    notes: string | null
    created_at: string
    profiles: {
      full_name: string
      email: string
    }
  }>
}

export default function AdminRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAdminAuth()
  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({ 
    open: false, 
    title: '', 
    description: '' 
  })
  
  const supabase = createClient()

  const fetchRequestDetails = useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('reimbursement_requests')
      .select(`
        *,
        profiles!reimbursement_requests_user_id_fkey (
          full_name,
          email,
          department,
          student_id
        ),
        reimbursement_items (
          id,
          description,
          amount,
          category,
          date,
          is_manual_entry
        ),
        approval_history (
          id,
          action,
          performed_by,
          notes,
          created_at,
          profiles!approval_history_performed_by_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (!error && data) {
      setRequest(data)
      setAdminNotes(data.admin_notes || '')
    }
    setLoading(false)
  }, [params.id, supabase])

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchRequestDetails()
    }
  }, [params.id, authLoading, isAdmin, fetchRequestDetails])

  async function handleApprove() {
    setProcessing(true)
    
    try {
      const response = await fetch(`/api/admin/requests/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      })

      const result = await response.json()

      if (response.ok) {
        setToast({
          open: true,
          title: 'Request Approved',
          description: 'The reimbursement request has been approved successfully.'
        })
        setTimeout(() => router.push('/admin/requests'), 2000)
      } else {
        setToast({
          open: true,
          title: 'Error',
          description: result.error || 'Failed to approve request'
        })
      }
    } catch {
      setToast({
        open: true,
        title: 'Error',
        description: 'Network error occurred'
      })
    }
    
    setProcessing(false)
    setShowApprovalForm(false)
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setToast({
        open: true,
        title: 'Error',
        description: 'Please provide a reason for rejection'
      })
      return
    }

    setProcessing(true)
    
    try {
      const response = await fetch(`/api/admin/requests/${params.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rejection_reason: rejectionReason,
          admin_notes: adminNotes 
        })
      })

      const result = await response.json()

      if (response.ok) {
        setToast({
          open: true,
          title: 'Request Rejected',
          description: 'The reimbursement request has been rejected.'
        })
        setTimeout(() => router.push('/admin/requests'), 2000)
      } else {
        setToast({
          open: true,
          title: 'Error',
          description: result.error || 'Failed to reject request'
        })
      }
    } catch {
      setToast({
        open: true,
        title: 'Error',
        description: 'Network error occurred'
      })
    }
    
    setProcessing(false)
    setShowRejectionForm(false)
  }

  if (loading || authLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!request) {
    return <div className="text-center py-8">Request not found</div>
  }

  const canTakeAction = request.status === 'submitted' || request.status === 'under_review'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request #{request.id.slice(0, 8)}</h1>
          <p className="text-gray-600 mt-1">Review and manage this reimbursement request</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/requests')}
        >
          Back to Requests
        </Button>
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{request.profiles.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{request.profiles.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{request.profiles.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-medium">{request.profiles.student_id || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold">${request.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted Date</p>
              <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Items</p>
              <p className="font-medium">{request.reimbursement_items.length}</p>
            </div>
          </div>
          
          {request.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Student Notes</p>
              <p className="text-sm">{request.notes}</p>
            </div>
          )}

          {request.rejection_reason && (
            <div className="mt-4 p-4 bg-red-50 rounded">
              <p className="text-sm text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm">{request.rejection_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Items */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody>
                {request.reimbursement_items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 text-sm">{item.date}</td>
                    <td className="py-3 text-sm">{item.description}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium">${item.amount.toFixed(2)}</td>
                    <td className="py-3 text-sm text-gray-500">
                      {item.is_manual_entry ? 'Manual' : 'Bank'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approval History */}
      {request.approval_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.approval_history.map((history) => (
                <div key={history.id} className="flex justify-between items-start border-b pb-4 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      by {history.profiles.full_name} on {new Date(history.created_at).toLocaleString()}
                    </p>
                    {history.notes && (
                      <p className="text-sm text-gray-500 mt-1">{history.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canTakeAction && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes (Internal)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any internal notes here..."
                />
              </div>
              
              {!showApprovalForm && !showRejectionForm && (
                <div className="flex gap-4">
                  <Button
                    onClick={() => setShowApprovalForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve Request
                  </Button>
                  <Button
                    onClick={() => setShowRejectionForm(true)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    Reject Request
                  </Button>
                </div>
              )}

              {showApprovalForm && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to approve this request for ${request.total_amount.toFixed(2)}?
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing ? 'Processing...' : 'Confirm Approval'}
                    </Button>
                    <Button
                      onClick={() => setShowApprovalForm(false)}
                      variant="outline"
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {showRejectionForm && (
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason (Required)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                      placeholder="Please provide a reason for rejection..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {processing ? 'Processing...' : 'Confirm Rejection'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectionForm(false)
                        setRejectionReason('')
                      }}
                      variant="outline"
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      {request && (
        <RequestComments 
          requestId={request.id} 
          isAdmin={true} 
        />
      )}
      
      <Toast 
        open={toast.open} 
        onOpenChange={(open) => setToast(t => ({ ...t, open }))} 
        title={toast.title} 
        description={toast.description} 
      />
    </div>
  )
}