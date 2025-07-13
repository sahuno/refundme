'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, BookOpen, TrendingUp, PiggyBank, Calculator, Lightbulb, Eye, Heart, Bookmark, Share2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type EducationalContent = Database['public']['Tables']['educational_content']['Row']
// type ContentInteraction = Database['public']['Tables']['content_interactions']['Row']

const categoryIcons = {
  tips: Lightbulb,
  tax: Calculator,
  budgeting: BookOpen,
  savings: PiggyBank,
  investing: TrendingUp,
} as const

const categoryColors = {
  tips: 'bg-blue-100 text-blue-800',
  tax: 'bg-purple-100 text-purple-800',
  budgeting: 'bg-green-100 text-green-800',
  savings: 'bg-yellow-100 text-yellow-800',
  investing: 'bg-red-100 text-red-800',
} as const

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<EducationalContent | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<EducationalContent[]>([])
  const [interactions, setInteractions] = useState<{
    liked: boolean
    bookmarked: boolean
  }>({ liked: false, bookmarked: false })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      fetchArticle()
    }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (article) {
      trackView()
    }
  }, [article]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchArticle = async () => {
    try {
      setLoading(true)
      
      // Fetch the article
      const { data: articleData, error: articleError } = await supabase
        .from('educational_content')
        .select('*')
        .eq('slug', slug)
        .single()

      if (articleError) throw articleError
      setArticle(articleData)

      // Fetch user interactions
      const { data: { user } } = await supabase.auth.getUser()
      if (user && articleData) {
        const { data: interactionData } = await supabase
          .from('content_interactions')
          .select('interaction_type')
          .eq('user_id', user.id)
          .eq('content_id', articleData.id)

        if (interactionData) {
          const liked = interactionData.some(i => i.interaction_type === 'like')
          const bookmarked = interactionData.some(i => i.interaction_type === 'bookmark')
          setInteractions({ liked, bookmarked })
        }
      }

      // Fetch related articles
      if (articleData) {
        const { data: related } = await supabase
          .from('educational_content')
          .select('*')
          .eq('category', articleData.category)
          .neq('id', articleData.id)
          .not('published_at', 'is', null)
          .order('view_count', { ascending: false })
          .limit(3)

        if (related) setRelatedArticles(related)
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      router.push('/dashboard/learn')
    } finally {
      setLoading(false)
    }
  }

  const trackView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !article) return

      // Check if user has already viewed this article
      const { data: existingView } = await supabase
        .from('content_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', article.id)
        .eq('interaction_type', 'view')
        .single()

      if (!existingView) {
        // Track user view
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

        // Update local state
        setArticle(prev => prev ? { ...prev, view_count: prev.view_count + 1 } : null)
      }
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const handleInteraction = async (type: 'like' | 'bookmark') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !article) return

      const isCurrentlyActive = interactions[type === 'like' ? 'liked' : 'bookmarked']

      if (isCurrentlyActive) {
        // Remove interaction
        await supabase
          .from('content_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', article.id)
          .eq('interaction_type', type)
      } else {
        // Add interaction
        await supabase
          .from('content_interactions')
          .insert({
            user_id: user.id,
            content_id: article.id,
            interaction_type: type
          })
      }

      setInteractions(prev => ({
        ...prev,
        [type === 'like' ? 'liked' : 'bookmarked']: !isCurrentlyActive
      }))
    } catch (error) {
      console.error('Error handling interaction:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: `Check out this article: ${article.title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Article not found.</p>
        <Button onClick={() => router.push('/dashboard/learn')} className="mt-4">
          Back to Education Hub
        </Button>
      </div>
    )
  }

  const Icon = categoryIcons[article.category]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/learn')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Education Hub
      </Button>

      {/* Article header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <Badge className={categoryColors[article.category]} variant="secondary">
            {article.category}
          </Badge>
          {article.featured && (
            <Badge variant="default">Featured</Badge>
          )}
        </div>
        
        <h1 className="text-3xl font-bold">{article.title}</h1>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{new Date(article.published_at!).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.view_count} views
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInteraction('like')}
              className={interactions.liked ? 'text-red-500' : ''}
            >
              <Heart className={`h-4 w-4 ${interactions.liked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInteraction('bookmark')}
              className={interactions.bookmarked ? 'text-blue-500' : ''}
            >
              <Bookmark className={`h-4 w-4 ${interactions.bookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Article content */}
      <Card>
        <CardContent className="pt-6 prose prose-gray max-w-none">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </CardContent>
      </Card>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold">Related Articles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedArticles.map((related) => {
              const RelatedIcon = categoryIcons[related.category]
              return (
                <Card
                  key={related.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/learn/${related.slug}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <RelatedIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge className={`${categoryColors[related.category]} text-xs`} variant="secondary">
                        {related.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{related.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {related.content.substring(0, 80)}...
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}