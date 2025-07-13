'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Toast } from '@/components/ui/toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Settings, DollarSign, Mail, FileCheck, Shield } from 'lucide-react'

interface AdminSettings {
  auto_approval_limit: {
    enabled: boolean
    amount: number
  }
  notification_emails: {
    enabled: boolean
    recipients: string[]
  }
  require_receipts: {
    enabled: boolean
    minimum_amount: number
  }
}

export default function SettingsPage() {
  const { isLoading: authLoading, profile } = useAdminAuth()
  const [settings, setSettings] = useState<AdminSettings>({
    auto_approval_limit: { enabled: false, amount: 50 },
    notification_emails: { enabled: true, recipients: [] },
    require_receipts: { enabled: true, minimum_amount: 25 }
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ open: false, title: '', description: '' })
  const [newEmail, setNewEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && profile?.role === 'administrator') {
      loadSettings()
    }
  }, [authLoading, profile]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSettings() {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .in('key', ['auto_approval_limit', 'notification_emails', 'require_receipts'])

    if (!error && data) {
      const newSettings = { ...settings }
      data.forEach(setting => {
        if (setting.key === 'auto_approval_limit' && setting.value) {
          newSettings.auto_approval_limit = setting.value as typeof newSettings.auto_approval_limit
        } else if (setting.key === 'notification_emails' && setting.value) {
          newSettings.notification_emails = setting.value as typeof newSettings.notification_emails
        } else if (setting.key === 'require_receipts' && setting.value) {
          newSettings.require_receipts = setting.value as typeof newSettings.require_receipts
        }
      })
      setSettings(newSettings)
    }
    setLoading(false)
  }

  async function saveSetting(key: keyof AdminSettings, value: AdminSettings[keyof AdminSettings]) {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key,
        value,
        updated_by: profile?.id,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)

    if (!error) {
      setToast({
        open: true,
        title: 'Settings Saved',
        description: 'Your changes have been saved successfully.'
      })
    } else {
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to save settings. Please try again.'
      })
    }
  }

  function addEmail() {
    if (newEmail && !settings.notification_emails.recipients.includes(newEmail)) {
      const updated = {
        ...settings.notification_emails,
        recipients: [...settings.notification_emails.recipients, newEmail]
      }
      setSettings({ ...settings, notification_emails: updated })
      saveSetting('notification_emails', updated)
      setNewEmail('')
    }
  }

  function removeEmail(email: string) {
    const updated = {
      ...settings.notification_emails,
      recipients: settings.notification_emails.recipients.filter(e => e !== email)
    }
    setSettings({ ...settings, notification_emails: updated })
    saveSetting('notification_emails', updated)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
      </div>
    )
  }

  if (profile?.role !== 'administrator') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              <p>Only administrators can access settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Admin Settings
        </h1>
      </div>

      {/* Auto-Approval Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            <CardTitle>Auto-Approval Rules</CardTitle>
          </div>
          <CardDescription>
            Automatically approve requests below a certain amount
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-approval">Enable Auto-Approval</Label>
            <Switch
              id="auto-approval"
              checked={settings.auto_approval_limit.enabled}
              onCheckedChange={(checked) => {
                const updated = { ...settings.auto_approval_limit, enabled: checked }
                setSettings({ ...settings, auto_approval_limit: updated })
                saveSetting('auto_approval_limit', updated)
              }}
            />
          </div>
          
          {settings.auto_approval_limit.enabled && (
            <div className="space-y-2">
              <Label htmlFor="approval-amount">Maximum Amount for Auto-Approval</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <Input
                  id="approval-amount"
                  type="number"
                  value={settings.auto_approval_limit.amount}
                  onChange={(e) => {
                    const updated = { 
                      ...settings.auto_approval_limit, 
                      amount: parseFloat(e.target.value) || 0 
                    }
                    setSettings({ ...settings, auto_approval_limit: updated })
                  }}
                  onBlur={() => saveSetting('auto_approval_limit', settings.auto_approval_limit)}
                  className="w-32"
                />
              </div>
              <p className="text-sm text-gray-500">
                Requests under ${settings.auto_approval_limit.amount} will be automatically approved
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            <CardTitle>Receipt Requirements</CardTitle>
          </div>
          <CardDescription>
            Configure when receipts are required for reimbursements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="require-receipts">Require Receipts</Label>
            <Switch
              id="require-receipts"
              checked={settings.require_receipts.enabled}
              onCheckedChange={(checked) => {
                const updated = { ...settings.require_receipts, enabled: checked }
                setSettings({ ...settings, require_receipts: updated })
                saveSetting('require_receipts', updated)
              }}
            />
          </div>
          
          {settings.require_receipts.enabled && (
            <div className="space-y-2">
              <Label htmlFor="receipt-amount">Minimum Amount Requiring Receipt</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <Input
                  id="receipt-amount"
                  type="number"
                  value={settings.require_receipts.minimum_amount}
                  onChange={(e) => {
                    const updated = { 
                      ...settings.require_receipts, 
                      minimum_amount: parseFloat(e.target.value) || 0 
                    }
                    setSettings({ ...settings, require_receipts: updated })
                  }}
                  onBlur={() => saveSetting('require_receipts', settings.require_receipts)}
                  className="w-32"
                />
              </div>
              <p className="text-sm text-gray-500">
                Expenses over ${settings.require_receipts.minimum_amount} will require a receipt
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure additional email recipients for new submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Enable Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={settings.notification_emails.enabled}
              onCheckedChange={(checked) => {
                const updated = { ...settings.notification_emails, enabled: checked }
                setSettings({ ...settings, notification_emails: updated })
                saveSetting('notification_emails', updated)
              }}
            />
          </div>
          
          {settings.notification_emails.enabled && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addEmail()
                    }
                  }}
                />
                <Button onClick={addEmail} disabled={!newEmail}>
                  Add Email
                </Button>
              </div>
              
              {settings.notification_emails.recipients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recipients:</p>
                  {settings.notification_emails.recipients.map((email) => (
                    <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{email}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEmail(email)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  )
}