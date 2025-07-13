import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RequestSubmissionData {
  request_id: string
  student_name: string
  total_amount: number
  admin_email: string
  department?: string
  items: Array<{
    description: string
    amount: number
    date: string
    category: string
  }>
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@university.edu'
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

async function sendSubmissionEmail(data: RequestSubmissionData) {
  if (!RESEND_API_KEY) {
    console.log('No Resend API key configured - email notification skipped')
    return { success: true, message: 'Email notification skipped (no API key)' }
  }

  try {
    const itemsTable = data.items.map(item => 
      `<tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.category}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">$${item.amount.toFixed(2)}</td>
      </tr>`
    ).join('')

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Reimbursement Request Submitted</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Request Details</h3>
          <p><strong>Student:</strong> ${data.student_name}</p>
          ${data.department ? `<p><strong>Department:</strong> ${data.department}</p>` : ''}
          <p><strong>Request ID:</strong> ${data.request_id}</p>
          <p><strong>Total Amount:</strong> $${data.total_amount.toFixed(2)}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <h3>Expense Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Category</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
          <p style="margin: 0;"><strong>Next Steps:</strong></p>
          <p style="margin: 5px 0 0 0;">Please review this request in the admin dashboard and approve/reject as appropriate.</p>
        </div>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.admin_email],
        subject: `New Reimbursement Request from ${data.student_name}${data.department ? ` (${data.department})` : ''} - $${data.total_amount.toFixed(2)}`,
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, emailId: result.id }

  } catch (error) {
    console.error('Email notification failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { request_id } = await req.json()

    if (!request_id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('reimbursement_requests')
      .select('*')
      .eq('id', request_id)
      .eq('user_id', user.id)
      .single()

    if (requestError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get user profile for student name and admin email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, admin_email, department')
      .eq('id', user.id)
      .single()

    // Get request items
    const { data: items, error: itemsError } = await supabase
      .from('reimbursement_items')
      .select('*')
      .eq('request_id', request_id)

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch request items' }, { status: 500 })
    }

    // Check auto-approval settings
    const { data: autoApprovalSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'auto_approval_limit')
      .single()

    let newStatus = 'submitted'
    let autoApproved = false

    if (autoApprovalSetting?.value?.enabled && autoApprovalSetting?.value?.amount && request.total_amount <= autoApprovalSetting.value.amount) {
      newStatus = 'approved'
      autoApproved = true
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('reimbursement_requests')
      .update({ 
        status: newStatus, 
        submitted_at: new Date().toISOString(),
        ...(autoApproved && {
          reviewed_at: new Date().toISOString(),
          admin_notes: `Auto-approved: Amount under $${autoApprovalSetting?.value?.amount || 0} threshold`
        })
      })
      .eq('id', request_id)
      .eq('user_id', user.id)
      .eq('status', 'draft') // Ensure we're only updating draft requests

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    // Create notification for auto-approval
    if (autoApproved) {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'request_approved',
          title: 'Request Auto-Approved',
          message: `Your reimbursement request for $${request.total_amount.toFixed(2)} has been automatically approved.`,
          related_request_id: request_id
        })
    }

    // Determine which admin email to use
    const adminEmail = profile?.admin_email || ADMIN_EMAIL
    
    // Send email notification
    const emailResult = await sendSubmissionEmail({
      request_id,
      student_name: profile?.full_name || 'Unknown Student',
      total_amount: request.total_amount,
      items: items || [],
      admin_email: adminEmail,
      department: profile?.department
    })

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      email_sent: emailResult.success,
      email_error: emailResult.success ? null : emailResult.error,
      admin_email: adminEmail,
      using_custom_admin: !!profile?.admin_email
    })

  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add OPTIONS for CORS support (for mobile app)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}