import { createClient } from './client'

export async function fetchUserTransactions(userId: string) {
  const supabase = await createClient()
  return supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
}

interface Transaction {
  user_id: string
  plaid_transaction_id: string
  bank_connection_id: string
  amount: number
  date: string
  description: string
  merchant_name?: string
  category?: string
}

export async function insertTransactions(transactions: Transaction[]) {
  const supabase = await createClient()
  return supabase
    .from('transactions')
    .upsert(transactions, { onConflict: 'plaid_transaction_id' })
} 