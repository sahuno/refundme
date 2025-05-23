import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
    plaidClientId: process.env.PLAID_CLIENT_ID ? 'Set' : 'Not Set',
    plaidSecret: process.env.PLAID_SECRET ? 'Set' : 'Not Set',
    plaidEnv: process.env.PLAID_ENV || 'Not Set',
  })
} 