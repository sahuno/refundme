import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid/client'

export async function GET() {
  try {
    // Test Plaid connection by getting categories
    const response = await plaidClient.categoriesGet({})
    
    return NextResponse.json({
      success: true,
      message: 'Plaid connection successful',
      categories_count: response.data.categories.length,
      env_vars: {
        plaid_client_id: !!process.env.PLAID_CLIENT_ID,
        plaid_secret: !!process.env.PLAID_SECRET,
        plaid_env: process.env.PLAID_ENV
      }
    })
  } catch (error) {
    console.error('Plaid test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env_vars: {
        plaid_client_id: !!process.env.PLAID_CLIENT_ID,
        plaid_secret: !!process.env.PLAID_SECRET,
        plaid_env: process.env.PLAID_ENV
      }
    }, { status: 500 })
  }
}