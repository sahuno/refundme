import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

interface PlaidTransaction {
  transaction_id: string
  amount: number
  date: string
  name: string
  merchant_name?: string | null
  category?: string[] | null
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { bank_connection_id } = await req.json()
    // Get the access token for this connection
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .select('plaid_access_token')
      .eq('id', bank_connection_id)
      .eq('user_id', user.id)
      .single()
    if (connError || !connection) {
      return NextResponse.json({ error: 'Bank connection not found' }, { status: 404 })
    }
    // Fetch transactions from Plaid (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const response = await plaidClient.transactionsGet({
      access_token: connection.plaid_access_token,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      options: { count: 100, offset: 0 },
    })
    const plaidTransactions = response.data.transactions
    // Map to DB schema
    const transactions = plaidTransactions.map((t: PlaidTransaction) => ({
      user_id: user.id,
      plaid_transaction_id: t.transaction_id,
      bank_connection_id,
      amount: t.amount,
      date: t.date,
      description: t.name,
      merchant_name: t.merchant_name,
      category: t.category?.[0] || null,
    }))
    // Upsert into DB
    const { error: upsertError } = await supabase
      .from('transactions')
      .upsert(transactions, { onConflict: 'plaid_transaction_id' })
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }
    // Update last_synced
    await supabase
      .from('bank_connections')
      .update({ last_synced: new Date().toISOString() })
      .eq('id', bank_connection_id)
    return NextResponse.json({ success: true, count: transactions.length })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json({ error: 'Error syncing transactions' }, { status: 500 })
  }
} 