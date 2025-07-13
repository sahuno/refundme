import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the public token and institution name from the request
    const { public_token, institution_name } = await request.json()

    // Exchange the public token for an access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const { access_token, item_id } = response.data

    // Store the access token and item ID in the database
    const { error: dbError } = await supabase
      .from('bank_connections')
      .insert({
        user_id: user.id,
        plaid_access_token: access_token,
        plaid_item_id: item_id,
        institution_name,
      })

    if (dbError) {
      throw dbError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Error exchanging token' },
      { status: 500 }
    )
  }
} 