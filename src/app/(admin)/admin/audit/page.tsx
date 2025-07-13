'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { 
  Shield, 
  Search, 
  User, 
  Calendar, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react'

interface AuditEntry {
  id: string
  request_id: string
  action: string
  performed_by: string
  notes: string | null
  metadata: {
    old_status?: string
    new_status?: string
    total_amount?: number
  } | null
  created_at: string
  profiles?: {
    full_name: string
    email: string
  }
  reimbursement_requests?: {
    id: string
    total_amount: number
    profiles?: {
      full_name: string
    }
  }
}

export default function AuditTrailPage() {
  const { isLoading: authLoading } = useAdminAuth()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [dateRange, setDateRange] = useState('last_30_days')
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading) {
      loadAuditTrail()
    }
  }, [authLoading, filterAction, dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAuditTrail() {
    setLoading(true)
    
    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case 'last_7_days':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'last_30_days':
        startDate.setDate(endDate.getDate() - 30)
        break
      case 'last_90_days':
        startDate.setDate(endDate.getDate() - 90)
        break
      case 'all_time':
        startDate = new Date('2020-01-01')
        break
    }

    let query = supabase
      .from('approval_history')
      .select(`
        *,
        profiles:performed_by (
          full_name,
          email
        ),
        reimbursement_requests:request_id (
          id,
          total_amount,
          profiles:user_id (
            full_name
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (filterAction !== 'all') {
      query = query.eq('action', filterAction)
    }

    const { data, error } = await query

    if (!error && data) {
      setEntries(data)
    }
    
    setLoading(false)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'submitted':
        return <FileText className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'info_requested':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'reviewed':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'paid':
        return <DollarSign className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
      case 'paid':
        return 'text-green-600 bg-green-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      case 'info_requested':
        return 'text-yellow-600 bg-yellow-50'
      case 'reviewed':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredEntries = entries.filter(entry => {
    const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
    const request = Array.isArray(entry.reimbursement_requests) 
      ? entry.reimbursement_requests[0] 
      : entry.reimbursement_requests
    const studentProfile = request?.profiles 
      ? (Array.isArray(request.profiles) ? request.profiles[0] : request.profiles)
      : null

    const searchLower = searchTerm.toLowerCase()
    
    return (
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower) ||
      studentProfile?.full_name?.toLowerCase().includes(searchLower) ||
      entry.notes?.toLowerCase().includes(searchLower) ||
      entry.request_id.toLowerCase().includes(searchLower)
    )
  })

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Audit Trail
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by user, request ID, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Actions</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="info_requested">Info Requested</option>
          <option value="reviewed">Reviewed</option>
          <option value="paid">Paid</option>
        </select>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="last_90_days">Last 90 Days</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No audit entries found matching your criteria.
              </p>
            ) : (
              filteredEntries.map((entry) => {
                const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
                const request = Array.isArray(entry.reimbursement_requests) 
                  ? entry.reimbursement_requests[0] 
                  : entry.reimbursement_requests
                const studentProfile = request?.profiles 
                  ? (Array.isArray(request.profiles) ? request.profiles[0] : request.profiles)
                  : null

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            <span className="font-semibold">{profile?.full_name || 'Unknown User'}</span>
                            <span className="text-gray-500"> {entry.action.replace('_', ' ')}</span>
                            {studentProfile && (
                              <span className="text-gray-700">
                                {' '}request from <span className="font-medium">{studentProfile.full_name}</span>
                              </span>
                            )}
                          </p>
                          
                          {entry.notes && (
                            <p className="text-sm text-gray-600">{entry.notes}</p>
                          )}
                          
                          {entry.metadata && (
                            <div className="text-xs text-gray-500 space-x-4">
                              {entry.metadata?.old_status && (
                                <span>
                                  Status: {entry.metadata.old_status} → {entry.metadata.new_status}
                                </span>
                              )}
                              {entry.metadata?.total_amount && (
                                <span>Amount: ${entry.metadata.total_amount.toFixed(2)}</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {profile?.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Request #{entry.request_id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}