import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params

  try {
    // Fetch the article
    const { data: article, error: articleError } = await supabase
      .from('educational_content')
      .select('*')
      .eq('slug', slug)
      .single()

    if (articleError) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Increment view count
    if (user) {
      // Check if user has already viewed this article
      const { data: existingView } = await supabase
        .from('content_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', article.id)
        .eq('interaction_type', 'view')
        .single()

      if (!existingView) {
        // Track new view
        await supabase
          .from('content_interactions')
          .insert({
            user_id: user.id,
            content_id: article.id,
            interaction_type: 'view'
          })

        // Increment view count
        await supabase
          .from('educational_content')
          .update({ view_count: article.view_count + 1 })
          .eq('id', article.id)
        
        article.view_count += 1
      }

      // Get user interactions
      const { data: interactions } = await supabase
        .from('content_interactions')
        .select('interaction_type')
        .eq('user_id', user.id)
        .eq('content_id', article.id)

      const userInteractions = {
        liked: interactions?.some(i => i.interaction_type === 'like') || false,
        bookmarked: interactions?.some(i => i.interaction_type === 'bookmark') || false,
      }

      return NextResponse.json({ 
        data: article,
        interactions: userInteractions
      })
    }

    return NextResponse.json({ data: article })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}