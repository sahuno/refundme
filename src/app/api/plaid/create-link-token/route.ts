import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { plaidClient } from '@/lib/plaid/client'
import { CountryCode, Products } from 'plaid'

export async function POST() {
  try {
    console.log('Link token API called')
    const supabase = createServerComponentClient({ 
      cookies: async () => {
        const cookieStore = await cookies();
        return cookieStore;
      }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User check:', { user: !!user, error: userError?.message })
    
    if (userError || !user) {
      console.log('Authentication failed:', userError?.message)
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Create a link token
    const request = {
      user: {
        client_user_id: user.id,
      },
      client_name: 'RefundMe',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    }

    console.log('Creating link token with request:', JSON.stringify(request, null, 2))
    
    try {
      const response = await plaidClient.linkTokenCreate(request)
      const linkToken = response.data.link_token
      console.log('Link token created successfully')

      return NextResponse.json({ linkToken })
    } catch (plaidError: any) {
      console.error('Plaid API error:', plaidError)
      
      // Extract detailed error information
      let errorDetails = {
        message: 'Error creating link token',
        code: 'UNKNOWN_ERROR',
        type: 'UNKNOWN'
      }
      
      if (plaidError.response?.data) {
        errorDetails = {
          message: plaidError.response.data.error_message || 'Plaid API error',
          code: plaidError.response.data.error_code || 'PLAID_ERROR',
          type: plaidError.response.data.error_type || 'API_ERROR'
        }
      } else if (plaidError instanceof Error) {
        errorDetails.message = plaidError.message
      }
      
      console.error('Detailed error:', errorDetails)
      
      return NextResponse.json(
        { 
          error: errorDetails.message,
          code: errorDetails.code,
          type: errorDetails.type
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    let errorMessage = 'Unexpected error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 