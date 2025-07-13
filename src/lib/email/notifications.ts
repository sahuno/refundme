import { createClient } from '@/lib/supabase/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

interface EmailNotificationData {
  to: string
  studentName: string
  requestId: string
  totalAmount: number
  type: 'approved' | 'rejected' | 'info_requested'
  adminNotes?: string
  rejectionReason?: string
}

export async function sendStatusUpdateEmail(data: EmailNotificationData) {
  if (!RESEND_API_KEY) {
    console.log('No Resend API key configured - email notification skipped')
    return { success: true, message: 'Email notification skipped (no API key)' }
  }

  try {
    let subject: string
    let htmlContent: string

    switch (data.type) {
      case 'approved':
        subject = `Reimbursement Request Approved - $${data.totalAmount.toFixed(2)}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Request Approved! 🎉</h1>
            </div>
            
            <div style="padding: 30px;">
              <p>Hi ${data.studentName},</p>
              
              <p>Great news! Your reimbursement request has been approved.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details</h3>
                <p><strong>Request ID:</strong> ${data.requestId}</p>
                <p><strong>Approved Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
                <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
                ${data.adminNotes ? `<p><strong>Admin Notes:</strong> ${data.adminNotes}</p>` : ''}
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Your reimbursement will be processed within 5-7 business days</li>
                <li>You will receive payment via your registered payment method</li>
                <li>Check your dashboard for updates on payment status</li>
              </ul>
              
              <p>If you have any questions, please contact the finance department.</p>
              
              <p>Best regards,<br>Finance Team</p>
            </div>
          </div>
        `
        break

      case 'rejected':
        subject = `Reimbursement Request Update - Action Required`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Request Needs Revision</h1>
            </div>
            
            <div style="padding: 30px;">
              <p>Hi ${data.studentName},</p>
              
              <p>Your reimbursement request needs some adjustments before it can be approved.</p>
              
              <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="margin-top: 0; color: #991b1b;">Reason for Rejection</h3>
                <p>${data.rejectionReason || 'Please review the admin notes for details.'}</p>
                ${data.adminNotes ? `<p><strong>Additional Notes:</strong> ${data.adminNotes}</p>` : ''}
              </div>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details</h3>
                <p><strong>Request ID:</strong> ${data.requestId}</p>
                <p><strong>Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
                <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p><strong>What to do next:</strong></p>
              <ul>
                <li>Review the rejection reason carefully</li>
                <li>Gather any missing documentation</li>
                <li>Submit a new request with the required information</li>
              </ul>
              
              <p>If you have questions about the rejection reason, please contact the finance department.</p>
              
              <p>Best regards,<br>Finance Team</p>
            </div>
          </div>
        `
        break

      case 'info_requested':
        subject = `Additional Information Needed - Reimbursement Request`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Additional Information Needed</h1>
            </div>
            
            <div style="padding: 30px;">
              <p>Hi ${data.studentName},</p>
              
              <p>We need some additional information to process your reimbursement request.</p>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #92400e;">Information Requested</h3>
                <p>${data.adminNotes || 'Please check your dashboard for specific requirements.'}</p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details</h3>
                <p><strong>Request ID:</strong> ${data.requestId}</p>
                <p><strong>Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
              </div>
              
              <p><strong>Please provide the requested information as soon as possible to avoid delays.</strong></p>
              
              <p>You can update your request by logging into your dashboard.</p>
              
              <p>Best regards,<br>Finance Team</p>
            </div>
          </div>
        `
        break
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.to],
        subject,
        html: htmlContent,
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

// Helper function to send notification to student when admin takes action
export async function notifyStudentOfStatusChange(
  requestId: string,
  status: 'approved' | 'rejected' | 'info_requested',
  adminNotes?: string,
  rejectionReason?: string
) {
  const supabase = await createClient()
  
  // Get request and student details
  const { data: request } = await supabase
    .from('reimbursement_requests')
    .select('*, profiles!reimbursement_requests_user_id_fkey(email, full_name)')
    .eq('id', requestId)
    .single()

  if (!request || !request.profiles) {
    console.error('Could not find request or student details')
    return
  }

  const profile = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles

  return sendStatusUpdateEmail({
    to: profile.email,
    studentName: profile.full_name || 'Student',
    requestId: request.id,
    totalAmount: request.total_amount,
    type: status,
    adminNotes,
    rejectionReason
  })
}