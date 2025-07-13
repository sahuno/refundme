import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { notifyStudentOfStatusChange } from '@/lib/email/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check admin access
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || !(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { rejection_reason, admin_notes } = body

    if (!rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('reimbursement_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason,
        admin_notes: admin_notes || null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject request' },
        { status: 500 }
      )
    }

    // Create notification for the student
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedRequest.user_id,
        type: 'request_rejected',
        title: 'Reimbursement Request Rejected',
        message: `Your reimbursement request has been rejected. Reason: ${rejection_reason}`,
        related_request_id: id
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    // Send email notification
    await notifyStudentOfStatusChange(
      id,
      'rejected',
      admin_notes,
      rejection_reason
    )

    return NextResponse.json({
      success: true,
      message: 'Request rejected successfully'
    })
  } catch (error) {
    console.error('Error in reject request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}