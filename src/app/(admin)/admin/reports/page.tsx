'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp, 
  Users,
  DollarSign,
  FileText,
  PieChart
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface MonthlyData {
  month: string
  approved: number
  rejected: number
  total_amount: number
}

interface CategoryData {
  category: string
  amount: number
  count: number
}

interface DepartmentData {
  department: string
  total_amount: number
  request_count: number
  user_count: number
}

export default function ReportsPage() {
  const { isLoading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last_30_days')
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([])
  const [stats, setStats] = useState({
    total_requests: 0,
    total_approved: 0,
    total_amount: 0,
    average_processing_time: 0,
    approval_rate: 0
  })
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading) {
      loadReportData()
    }
  }, [authLoading, dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadReportData() {
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
      case 'year_to_date':
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
    }

    // Get all requests in date range
    const { data: requests } = await supabase
      .from('reimbursement_requests')
      .select(`
        *,
        reimbursement_items (*),
        profiles!reimbursement_requests_user_id_fkey (
          department
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (requests) {
      // Calculate overall stats
      const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'paid')
      const totalAmount = approvedRequests.reduce((sum, r) => sum + r.total_amount, 0)
      
      // Calculate average processing time for approved/rejected requests
      const processedRequests = requests.filter(r => r.reviewed_at)
      const totalProcessingHours = processedRequests.reduce((sum, r) => {
        const created = new Date(r.created_at)
        const reviewed = new Date(r.reviewed_at)
        return sum + (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60)
      }, 0)
      
      setStats({
        total_requests: requests.length,
        total_approved: approvedRequests.length,
        total_amount: totalAmount,
        average_processing_time: processedRequests.length > 0 
          ? totalProcessingHours / processedRequests.length 
          : 0,
        approval_rate: requests.length > 0 
          ? (approvedRequests.length / requests.length) * 100 
          : 0
      })

      // Group by month
      const monthlyGroups: { [key: string]: MonthlyData } = {}
      requests.forEach(request => {
        const date = new Date(request.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            approved: 0,
            rejected: 0,
            total_amount: 0
          }
        }
        
        if (request.status === 'approved' || request.status === 'paid') {
          monthlyGroups[monthKey].approved++
          monthlyGroups[monthKey].total_amount += request.total_amount
        } else if (request.status === 'rejected') {
          monthlyGroups[monthKey].rejected++
        }
      })
      setMonthlyData(Object.values(monthlyGroups))

      // Group by category
      const categoryGroups: { [key: string]: CategoryData } = {}
      approvedRequests.forEach(request => {
        request.reimbursement_items?.forEach((item: { category: string; amount: number }) => {
          if (!categoryGroups[item.category]) {
            categoryGroups[item.category] = {
              category: item.category,
              amount: 0,
              count: 0
            }
          }
          categoryGroups[item.category].amount += item.amount
          categoryGroups[item.category].count++
        })
      })
      setCategoryData(Object.values(categoryGroups).sort((a, b) => b.amount - a.amount))

      // Group by department
      const deptGroups: { [key: string]: DepartmentData } = {}
      const usersByDept: { [key: string]: Set<string> } = {}
      
      requests.forEach(request => {
        const profile = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles
        const dept = profile?.department || 'No Department'
        
        if (!deptGroups[dept]) {
          deptGroups[dept] = {
            department: dept,
            total_amount: 0,
            request_count: 0,
            user_count: 0
          }
          usersByDept[dept] = new Set()
        }
        
        deptGroups[dept].request_count++
        if (request.status === 'approved' || request.status === 'paid') {
          deptGroups[dept].total_amount += request.total_amount
        }
        usersByDept[dept].add(request.user_id)
      })
      
      // Update user counts
      Object.keys(deptGroups).forEach(dept => {
        deptGroups[dept].user_count = usersByDept[dept].size
      })
      
      setDepartmentData(Object.values(deptGroups))
    }
    
    setLoading(false)
  }

  async function exportToCSV() {
    // Generate CSV data
    const headers = ['Month', 'Approved Requests', 'Rejected Requests', 'Total Amount']
    const rows = monthlyData.map(data => [
      data.month,
      data.approved,
      data.rejected,
      data.total_amount.toFixed(2)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reimbursement-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="year_to_date">Year to Date</option>
          </select>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_requests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approval_rate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_amount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_processing_time.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.total_approved > 0 ? (stats.total_amount / stats.total_approved).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Request Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.slice(0, 5).map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span>{cat.category}</span>
                  </div>
                  <span className="font-medium">${cat.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Department Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Department</th>
                    <th className="text-right py-2">Users</th>
                    <th className="text-right py-2">Requests</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentData.map((dept) => (
                    <tr key={dept.department} className="border-b">
                      <td className="py-2">{dept.department}</td>
                      <td className="py-2 text-right">{dept.user_count}</td>
                      <td className="py-2 text-right">{dept.request_count}</td>
                      <td className="py-2 text-right font-medium">
                        ${dept.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}