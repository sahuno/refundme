import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid/client'

export async function GET() {
  const envCheck = {
    plaid_client_id: !!process.env.PLAID_CLIENT_ID,
    plaid_secret: !!process.env.PLAID_SECRET,
    plaid_env: process.env.PLAID_ENV || 'not set',
    next_public_plaid_env: process.env.NEXT_PUBLIC_PLAID_ENV || 'not set',
    client_id_length: process.env.PLAID_CLIENT_ID?.length || 0,
    secret_length: process.env.PLAID_SECRET?.length || 0,
    all_env_keys: Object.keys(process.env).filter(k => k.includes('PLAID')).sort()
  }

  // Check if credentials are missing
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return NextResponse.json({
      success: false,
      error: 'Missing Plaid credentials',
      message: 'Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables in Vercel',
      env_check: envCheck,
      instructions: {
        step1: 'Go to your Vercel project dashboard',
        step2: 'Navigate to Settings > Environment Variables',
        step3: 'Add PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV, and NEXT_PUBLIC_PLAID_ENV',
        step4: 'Redeploy your application'
      }
    }, { status: 500 })
  }

  try {
    // Test Plaid connection by getting categories
    const response = await plaidClient.categoriesGet({})
    
    return NextResponse.json({
      success: true,
      message: 'Plaid connection successful',
      categories_count: response.data.categories.length,
      env_check: envCheck
    })
  } catch (error: any) {
    console.error('Plaid test error:', error)
    
    let errorDetails = {
      message: 'Unknown error',
      code: 'UNKNOWN',
      type: 'UNKNOWN'
    }
    
    if (error.response?.data) {
      errorDetails = {
        message: error.response.data.error_message || 'Plaid API error',
        code: error.response.data.error_code || 'PLAID_ERROR',
        type: error.response.data.error_type || 'API_ERROR'
      }
    } else if (error instanceof Error) {
      errorDetails.message = error.message
    }
    
    return NextResponse.json({
      success: false,
      error: errorDetails,
      env_check: envCheck,
      raw_error: error.toString()
    }, { status: 500 })
  }
}