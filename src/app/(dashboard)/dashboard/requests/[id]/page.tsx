'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequestComments } from '@/components/RequestComments'
import { ArrowLeft, DollarSign, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface RequestDetails {
  id: string
  created_at: string
  total_amount: number
  status: string
  notes: string | null
  admin_notes: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_at: string | null
  reimbursement_items: Array<{
    id: string
    description: string
    amount: number
    date: string
    category: string
  }>
}

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadRequest()
    }
  }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRequest() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('reimbursement_requests')
      .select(`
        *,
        reimbursement_items (*)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setRequest(data)
    } else {
      router.push('/dashboard/requests')
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      paid: { color: 'bg-purple-100 text-purple-800', icon: DollarSign }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
      </div>
    )
  }

  if (!request) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Request Details</h1>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Request ID</p>
              <p className="font-medium">{request.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created Date</p>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            {request.submitted_at && (
              <div>
                <p className="text-sm text-gray-600">Submitted Date</p>
                <p className="font-medium">
                  {new Date(request.submitted_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {request.reviewed_at && (
              <div>
                <p className="text-sm text-gray-600">Reviewed Date</p>
                <p className="font-medium">
                  {new Date(request.reviewed_at).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${request.total_amount.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Notes</p>
                <p className="text-gray-700">{request.notes}</p>
              </div>
            )}
            
            {request.rejection_reason && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                <p className="text-red-700">{request.rejection_reason}</p>
              </div>
            )}
            
            {request.admin_notes && request.status === 'approved' && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Admin Notes</p>
                <p className="text-green-700">{request.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {request.reimbursement_items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">
                      ${item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 font-semibold">Total</td>
                  <td className="py-2 text-right font-bold text-lg">
                    ${request.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section - Only show for non-draft requests */}
      {request.status !== 'draft' && (
        <RequestComments 
          requestId={request.id} 
          isAdmin={false} 
        />
      )}
    </div>
  )
}