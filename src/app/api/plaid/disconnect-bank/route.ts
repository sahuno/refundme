import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connection_id } = await req.json()

    if (!connection_id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    // Get the bank connection details
    const { data: connection, error: connectionError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Bank connection not found' }, { status: 404 })
    }

    try {
      // Remove the item from Plaid
      await plaidClient.itemRemove({
        access_token: connection.plaid_access_token
      })
    } catch (plaidError) {
      console.error('Plaid item removal error:', plaidError)
      // Continue with local cleanup even if Plaid removal fails
    }

    // Delete transactions associated with this connection
    const { error: transactionsDeleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('bank_connection_id', connection_id)

    if (transactionsDeleteError) {
      console.error('Error deleting transactions:', transactionsDeleteError)
    }

    // Delete the bank connection
    const { error: deleteError } = await supabase
      .from('bank_connections')
      .delete()
      .eq('id', connection_id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Failed to disconnect bank account' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Bank account disconnected successfully'
    })

  } catch (error) {
    console.error('Bank disconnection error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}