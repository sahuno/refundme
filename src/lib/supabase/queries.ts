import { createClient } from './client'

export async function fetchUserTransactions(userId: string) {
  const supabase = createClient()
  return supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
}

export async function insertTransactions(transactions: Record<string, unknown>[]) {
  const supabase = createClient()
  return supabase
    .from('transactions')
    .upsert(transactions, { onConflict: 'plaid_transaction_id' })
} 