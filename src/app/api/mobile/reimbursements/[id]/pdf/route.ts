import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requestId } = await params

    // Get the reimbursement request
    const { data: request, error: requestError } = await supabase
      .from('reimbursement_requests')
      .select(`
        *,
        reimbursement_items (*)
      `)
      .eq('id', requestId)
      .eq('user_id', user.id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // For mobile, we'll return the data and let the app generate the PDF
    // since React-PDF doesn't work in React Native
    return NextResponse.json({
      request,
      profile,
      items: request.reimbursement_items || [],
    })
  } catch (err) {
    console.error('PDF data fetch error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add OPTIONS for CORS support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}