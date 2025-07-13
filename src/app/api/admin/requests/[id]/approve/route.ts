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
    const supabase = createClient()
    
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
    const { admin_notes } = body

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('reimbursement_requests')
      .update({
        status: 'approved' as const,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve request' },
        { status: 500 }
      )
    }

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Create notification for the student
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedRequest.user_id,
        type: 'request_approved' as const,
        title: 'Reimbursement Request Approved',
        message: `Your reimbursement request for $${updatedRequest.total_amount.toFixed(2)} has been approved.`,
        related_request_id: id
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    // Send email notification
    await notifyStudentOfStatusChange(
      id,
      'approved',
      admin_notes
    )

    return NextResponse.json({
      success: true,
      message: 'Request approved successfully'
    })
  } catch (error) {
    console.error('Error in approve request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}