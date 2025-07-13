'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { ContentCard } from '@/components/ContentCard'

type EducationalContent = Database['public']['Tables']['educational_content']['Row']
type ContentCategory = EducationalContent['category']


export default function LearnPage() {
  const [content, setContent] = useState<EducationalContent[]>([])
  const [featuredContent, setFeaturedContent] = useState<EducationalContent[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchContent()
  }, [selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Fetch featured content
      const { data: featured, error: featuredError } = await supabase
        .from('educational_content')
        .select('*')
        .eq('featured', true)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(3)

      if (featuredError) throw featuredError
      setFeaturedContent(featured || [])

      // Fetch regular content based on category
      let query = supabase
        .from('educational_content')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setContent(data || [])
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContent = content.filter(item => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.content.toLowerCase().includes(searchLower) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    )
  })

  const categories: Array<ContentCategory | 'all'> = ['all', 'tips', 'tax', 'budgeting', 'savings', 'investing']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Education Hub</h1>
        <p className="text-muted-foreground mt-2">
          Learn about budgeting, taxes, savings, and smart financial decisions for graduate students.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Content */}
      {selectedCategory === 'all' && featuredContent.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Featured Articles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredContent.map((article) => (
              <ContentCard key={article.id} article={article} featured />
            ))}
          </div>
        </div>
      )}

      {/* All Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {selectedCategory === 'all' ? 'All Articles' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Articles`}
        </h2>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No articles found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContent.map((article) => (
              <ContentCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}