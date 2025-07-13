import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface AdminStats {
  pending_requests: number
  requests_this_month: number
  approved_this_month: number
  total_approved_amount: number
  avg_processing_hours: number
}

interface RequestWithProfile {
  id: string
  total_amount: number
  status: string
  created_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

async function getAdminStats() {
  const supabase = await createClient()
  
  // Get stats from the view we created
  const { data: stats } = await supabase
    .from('admin_dashboard_stats')
    .select('*')
    .single()

  // Get recent requests
  const { data: recentRequests } = await supabase
    .from('reimbursement_requests')
    .select(`
      *,
      profiles!reimbursement_requests_user_id_fkey (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return { stats, recentRequests }
}

export default async function AdminDashboard() {
  const { stats, recentRequests } = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of reimbursement requests and system activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{(stats as AdminStats | null)?.pending_requests || 0}</div>
            <Link 
              href="/admin/requests?status=submitted" 
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              View pending →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Requests This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{(stats as AdminStats | null)?.requests_this_month || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              {(stats as AdminStats | null)?.approved_this_month || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Approved Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${((stats as AdminStats | null)?.total_approved_amount || 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Avg Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((stats as AdminStats | null)?.avg_processing_hours || 0)} hrs
            </div>
            <p className="text-sm text-gray-500 mt-1">From submission to decision</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Requests</CardTitle>
            <Link 
              href="/admin/requests" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Student</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Submitted</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(recentRequests as RequestWithProfile[] | null)?.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.profiles?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">{request.profiles?.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      ${(request.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/requests/${request.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!recentRequests || recentRequests.length === 0) && (
              <p className="text-center text-gray-500 py-8">No requests found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}