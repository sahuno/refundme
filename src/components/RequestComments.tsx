'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface Comment {
  id: string
  comment: string
  is_internal: boolean
  created_at: string
  user_id: string
  profiles?: {
    full_name: string
    role: string
  }
}

interface RequestCommentsProps {
  requestId: string
  isAdmin?: boolean
}

export function RequestComments({ requestId, isAdmin = false }: RequestCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadComments()

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_comments',
          filter: `request_id=eq.${requestId}`
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('request_comments')
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setComments(data)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('request_comments')
      .insert({
        request_id: requestId,
        user_id: user.id,
        comment: newComment.trim(),
        is_internal: isAdmin && isInternal
      })

    if (!error) {
      setNewComment('')
      setIsInternal(false)
      loadComments()
    }
    setSending(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'administrator':
      case 'accountant':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-b-2 border-gray-900 rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Start the discussion below.
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => {
                  const profile = Array.isArray(comment.profiles) 
                    ? comment.profiles[0] 
                    : comment.profiles

                  return (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-lg ${
                        comment.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {profile?.full_name || 'Unknown User'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(profile?.role)}`}>
                            {profile?.role || 'student'}
                          </span>
                          {comment.is_internal && (
                            <span className="flex items-center gap-1 text-xs text-yellow-700">
                              <Lock className="h-3 w-3" />
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                disabled={sending}
              />
              
              <div className="flex items-center justify-between">
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="internal"
                      checked={isInternal}
                      onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                      disabled={sending}
                    />
                    <label 
                      htmlFor="internal" 
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Internal note (only visible to admins)
                    </label>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={!newComment.trim() || sending}
                  className={isAdmin ? '' : 'ml-auto'}
                >
                  {sending ? (
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}