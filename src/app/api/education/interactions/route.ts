import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentId, interactionType } = await request.json()

    if (!contentId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['like', 'bookmark'].includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      )
    }

    // Check if interaction already exists
    const { data: existing } = await supabase
      .from('content_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('interaction_type', interactionType)
      .single()

    if (existing) {
      // Remove interaction (toggle off)
      const { error: deleteError } = await supabase
        .from('content_interactions')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ removed: true })
    } else {
      // Add interaction (toggle on)
      const { error: insertError } = await supabase
        .from('content_interactions')
        .insert({
          user_id: user.id,
          content_id: contentId,
          interaction_type: interactionType
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ added: true })
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to process interaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const contentId = searchParams.get('contentId')

  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('content_interactions')
      .select('*')
      .eq('user_id', user.id)

    if (contentId) {
      query = query.eq('content_id', contentId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}