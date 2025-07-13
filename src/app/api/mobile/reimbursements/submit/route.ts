import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { transactions, manualItems, description, adminEmail, notes } = body

    // Calculate total amount
    const transactionTotal = transactions?.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0) || 0
    const manualTotal = manualItems?.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) || 0
    const totalAmount = transactionTotal + manualTotal

    // 1. Create the reimbursement request
    const { data: request, error: requestError } = await supabase
      .from('reimbursement_requests')
      .insert({
        user_id: user.id,
        status: 'draft',
        total_amount: totalAmount,
        description: description || `Reimbursement Request - ${new Date().toLocaleDateString()}`,
        admin_email: adminEmail,
        notes: notes
      })
      .select()
      .single()

    if (requestError || !request) {
      console.error('Error creating request:', requestError)
      return NextResponse.json({ 
        error: 'Failed to create reimbursement request',
        details: requestError?.message 
      }, { status: 500 })
    }

    // 2. Create reimbursement items
    const items = []

    // Add transaction-based items
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        items.push({
          request_id: request.id,
          transaction_id: tx.id,
          amount: tx.amount,
          category: tx.category || 'Other',
          description: tx.description || tx.name,
          date: tx.date,
          is_manual_entry: false
        })
      }
    }

    // Add manual items
    if (manualItems && manualItems.length > 0) {
      for (const item of manualItems) {
        items.push({
          request_id: request.id,
          transaction_id: null,
          amount: item.amount,
          category: item.category || 'Other',
          description: item.description,
          date: item.date,
          is_manual_entry: true
        })
      }
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('reimbursement_items')
        .insert(items)

      if (itemsError) {
        // Rollback: delete the request if items creation failed
        await supabase
          .from('reimbursement_requests')
          .delete()
          .eq('id', request.id)

        console.error('Error creating items:', itemsError)
        return NextResponse.json({ 
          error: 'Failed to create reimbursement items',
          details: itemsError.message 
        }, { status: 500 })
      }
    }

    // 3. Submit the request using the existing submit-request endpoint
    const submitResponse = await fetch(`${req.headers.get('origin') || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/submit-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ request_id: request.id })
    })

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json()
      return NextResponse.json({ 
        error: 'Failed to submit request',
        details: errorData.error 
      }, { status: submitResponse.status })
    }

    const submitResult = await submitResponse.json()

    return NextResponse.json({
      success: true,
      request_id: request.id,
      message: 'Reimbursement request created and submitted successfully',
      admin_email: submitResult.admin_email,
      email_sent: submitResult.email_sent
    })

  } catch (error) {
    console.error('Submit reimbursement error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Add OPTIONS for CORS support
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