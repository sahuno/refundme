import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'
import { CountryCode, Products } from 'plaid'

export async function POST() {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    const response = await plaidClient.linkTokenCreate(request)
    const linkToken = response.data.link_token

    return NextResponse.json({ linkToken })
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: 'Error creating link token' },
      { status: 500 }
    )
  }
} 