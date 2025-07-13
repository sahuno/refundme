import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/supabase'
import { BookOpen, TrendingUp, PiggyBank, Calculator, Lightbulb, Eye, Heart, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'

type EducationalContent = Database['public']['Tables']['educational_content']['Row']

interface ContentCardProps {
  article: EducationalContent
  featured?: boolean
  onInteraction?: (type: 'like' | 'bookmark') => void
  userInteractions?: {
    liked: boolean
    bookmarked: boolean
  }
}

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

export function ContentCard({ article, featured = false, onInteraction, userInteractions }: ContentCardProps) {
  const router = useRouter()
  const Icon = categoryIcons[article.category]

  const handleCardClick = () => {
    router.push(`/dashboard/learn/${article.slug}`)
  }

  const handleInteraction = (e: React.MouseEvent, type: 'like' | 'bookmark') => {
    e.stopPropagation()
    if (onInteraction) {
      onInteraction(type)
    }
  }

  const contentPreview = featured 
    ? article.content.substring(0, 150) 
    : article.content.substring(0, 100)

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${featured ? 'h-full' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <Icon className={`${featured ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
          <Badge className={categoryColors[article.category]} variant="secondary">
            {article.category}
          </Badge>
        </div>
        <CardTitle className={`${featured ? 'text-lg' : 'text-base'} mt-2`}>
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm text-muted-foreground ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}>
          {contentPreview}...
        </p>
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-3">
            {article.tags.slice(0, featured ? 3 : 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{new Date(article.published_at!).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.view_count}
            </span>
          </div>
          
          {/* Interaction buttons (only if handler provided) */}
          {onInteraction && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleInteraction(e, 'like')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  userInteractions?.liked ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                <Heart className={`h-4 w-4 ${userInteractions?.liked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => handleInteraction(e, 'bookmark')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  userInteractions?.bookmarked ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${userInteractions?.bookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}