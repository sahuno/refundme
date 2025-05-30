'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'

interface Profile {
  id: string
  email: string
  full_name: string
  department?: string
  student_id?: string
  admin_email?: string
}

interface BankConnection {
  id: string
  institution_name: string
  last_synced: string | null
  created_at: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    student_id: '',
    admin_email: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([])
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({ open: false, title: '', description: '' })
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          department: profileData.department || '',
          student_id: profileData.student_id || '',
          admin_email: profileData.admin_email || ''
        })
      }

      // Fetch bank connections
      const { data: connectionsData } = await supabase
        .from('bank_connections')
        .select('id, institution_name, last_synced, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (connectionsData) {
        setBankConnections(connectionsData)
      }

      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          department: formData.department,
          student_id: formData.student_id,
          admin_email: formData.admin_email
        })
        .eq('id', profile.id)

      if (error) {
        setToast({
          open: true,
          title: 'Error',
          description: 'Failed to save profile settings'
        })
      } else {
        setToast({
          open: true,
          title: 'Settings Saved',
          description: 'Your profile has been updated successfully'
        })
        setProfile({ ...profile, ...formData })
      }
    } catch {
      setToast({
        open: true,
        title: 'Error',
        description: 'Network error occurred while saving'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectBank = async (connectionId: string, institutionName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${institutionName}? This will delete all associated transactions.`)) {
      return
    }

    setDisconnecting(connectionId)
    try {
      const response = await fetch('/api/plaid/disconnect-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connection_id: connectionId
        })
      })

      const result = await response.json()

      if (result.success) {
        setBankConnections(prev => prev.filter(conn => conn.id !== connectionId))
        setToast({
          open: true,
          title: 'Bank Disconnected',
          description: `${institutionName} has been disconnected successfully`
        })
      } else {
        setToast({
          open: true,
          title: 'Disconnection Failed',
          description: result.error || 'Failed to disconnect bank account'
        })
      }
    } catch (error) {
      console.error('Bank disconnection error:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Network error occurred while disconnecting bank'
      })
    } finally {
      setDisconnecting(null)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const canSave = formData.full_name.trim() && 
                  (!formData.admin_email || isValidEmail(formData.admin_email))

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 min-h-screen p-4">
      <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
      
      <div className="max-w-2xl">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <Input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Department/School
              </label>
              <Input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Computer Science, Engineering, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Student ID
              </label>
              <Input
                type="text"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="Enter your student ID"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              📧 Reimbursement Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            <div>
              <label className="block text-sm font-medium mb-2">
                School Admin Email
              </label>
              <Input
                type="email"
                value={formData.admin_email}
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                placeholder="admin@university.edu"
              />
              <p className="text-sm text-gray-600 mt-2">
                Enter the email address of your school/department administrator who should receive your reimbursement requests. 
                If left empty, requests will be sent to the default system admin.
              </p>
              {formData.admin_email && !isValidEmail(formData.admin_email) && (
                <p className="text-sm text-red-600 mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">💡</span>
                <div className="text-sm">
                  <strong>Why set an admin email?</strong>
                  <p className="mt-1">
                    When you submit a reimbursement request, an email notification will be sent to this admin email address. 
                    This ensures your department&apos;s financial officer gets notified immediately and can process your request quickly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              🏦 Bank Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            {bankConnections.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts Connected</h3>
                <p className="text-gray-600 mb-4">
                  Connect your bank account to automatically sync transactions and identify eligible expenses.
                </p>
                <p className="text-sm text-gray-500">
                  Go to the Transactions page to connect your first bank account.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Manage your connected bank accounts. Disconnecting will remove all associated transactions.
                </p>
                {bankConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {connection.institution_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {connection.institution_name || 'Unknown Bank'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Connected on {new Date(connection.created_at).toLocaleDateString()}
                          {connection.last_synced && (
                            <span className="ml-2">
                              • Last sync: {new Date(connection.last_synced).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectBank(connection.id, connection.institution_name)}
                      disabled={disconnecting === connection.id}
                      className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    >
                      {disconnecting === connection.id ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-sm">
                  <strong>Important:</strong>
                  <p className="mt-1 text-gray-700">
                    Disconnecting a bank account will permanently delete all associated transactions. 
                    Make sure to submit any pending reimbursement requests before disconnecting.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Toast 
        open={toast.open} 
        onOpenChange={(open) => setToast(t => ({ ...t, open }))} 
        title={toast.title} 
        description={toast.description} 
      />
    </div>
  )
}