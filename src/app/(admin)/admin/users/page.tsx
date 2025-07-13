'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Search, Users, DollarSign, FileText, Ban, CheckCircle } from 'lucide-react'

interface UserWithStats {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
  created_at: string
  is_active: boolean
  total_requests: number
  total_reimbursed: number
  current_allowance: number
  allowance_used: number
}

export default function UsersPage() {
  const { isLoading: authLoading } = useAdminAuth()
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading) {
      loadUsers()
    }
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadUsers() {
    setLoading(true)
    
    // Get all users with their stats
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        reimbursement_requests (
          id,
          total_amount,
          status
        ),
        allowances (
          total_allowance,
          used_allowance
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && profiles) {
      const usersWithStats = profiles.map(profile => {
        const requests = profile.reimbursement_requests || []
        const approvedRequests = requests.filter((r: { status: string }) => r.status === 'approved' || r.status === 'paid')
        const totalReimbursed = approvedRequests.reduce((sum: number, r: { total_amount: number }) => sum + r.total_amount, 0)
        
        const currentAllowance = profile.allowances?.[0]?.total_allowance || 0
        const allowanceUsed = profile.allowances?.[0]?.used_allowance || 0

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || 'No name',
          role: profile.role || 'student',
          department: profile.department,
          created_at: profile.created_at,
          is_active: profile.is_active !== false,
          total_requests: requests.length,
          total_reimbursed: totalReimbursed,
          current_allowance: currentAllowance,
          allowance_used: allowanceUsed
        }
      })

      setUsers(usersWithStats)
    }
    
    setLoading(false)
  }

  async function toggleUserStatus(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId)

    if (!error) {
      loadUsers()
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      loadUsers()
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && user.is_active) ||
      (filter === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesFilter
  })

  const getRoleBadge = (role: string) => {
    const colors = {
      administrator: 'bg-purple-100 text-purple-800',
      accountant: 'bg-blue-100 text-blue-800',
      student: 'bg-gray-100 text-gray-800'
    }
    return colors[role as keyof typeof colors] || colors.student
  }

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
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reimbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${users.reduce((sum, u) => sum + u.total_reimbursed, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, u) => sum + u.total_requests, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-right py-3 px-4">Requests</th>
                  <th className="text-right py-3 px-4">Reimbursed</th>
                  <th className="text-right py-3 px-4">Allowance</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}
                      >
                        <option value="student">Student</option>
                        <option value="accountant">Accountant</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {user.department || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user.total_requests}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ${user.total_reimbursed.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm">
                        <p>${user.allowance_used.toFixed(2)} / ${user.current_allowance.toFixed(2)}</p>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((user.allowance_used / user.current_allowance) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <Ban className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}