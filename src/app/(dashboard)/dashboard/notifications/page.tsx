'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  related_request_id?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadNotifications() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filter === 'unread') {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (!error && data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
    
    loadNotifications()
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false)
    
    loadNotifications()
  }

  async function deleteNotification(notificationId: string) {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    
    loadNotifications()
  }

  async function deleteAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true)
    
    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    const colors = {
      'request_approved': 'text-green-600 bg-green-50',
      'request_rejected': 'text-red-600 bg-red-50',
      'info_requested': 'text-yellow-600 bg-yellow-50',
      'payment_processed': 'text-blue-600 bg-blue-50',
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50'
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          {notifications.some(n => n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={deleteAllRead}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications to display</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${
                !notification.read ? 'border-blue-500 bg-blue-50/50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getNotificationIcon(notification.type)}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <p className="text-sm text-gray-400">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {notification.related_request_id && (
                            <Link
                              href={`/dashboard/requests/${notification.related_request_id}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              View Request →
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}