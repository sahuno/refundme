import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the request exists and belongs to the user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('reimbursement_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft requests
    if (existingRequest.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft requests can be deleted' },
        { status: 400 }
      )
    }

    // Delete the request (items will be cascade deleted due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('reimbursement_requests')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting request:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}