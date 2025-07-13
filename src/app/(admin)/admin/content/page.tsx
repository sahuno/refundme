'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  Star,
  StarOff
} from 'lucide-react'
import Link from 'next/link'

interface EducationalContent {
  id: string
  title: string
  slug: string
  category: string
  tags: string[]
  featured: boolean
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export default function ContentManagementPage() {
  const [content, setContent] = useState<EducationalContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadContent()
  }, [filterCategory, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadContent() {
    setLoading(true)
    
    let query = supabase
      .from('educational_content')
      .select('*')
      .order('created_at', { ascending: false })

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory)
    }

    if (filterStatus === 'published') {
      query = query.not('published_at', 'is', null)
    } else if (filterStatus === 'draft') {
      query = query.is('published_at', null)
    }

    const { data, error } = await query

    if (!error && data) {
      setContent(data)
    }
    setLoading(false)
  }

  async function toggleFeatured(id: string, currentFeatured: boolean) {
    const { error } = await supabase
      .from('educational_content')
      .update({ featured: !currentFeatured })
      .eq('id', id)

    if (!error) {
      loadContent()
    }
  }

  async function deleteContent(id: string) {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    setDeleting(id)
    const { error } = await supabase
      .from('educational_content')
      .delete()
      .eq('id', id)

    if (!error) {
      loadContent()
    }
    setDeleting(null)
  }

  const filteredContent = content.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryColor = (category: string) => {
    const colors = {
      tips: 'bg-blue-100 text-blue-800',
      tax: 'bg-green-100 text-green-800',
      budgeting: 'bg-purple-100 text-purple-800',
      savings: 'bg-orange-100 text-orange-800',
      investing: 'bg-red-100 text-red-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (publishedAt: string | null) => {
    if (publishedAt) {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>
    }
    return <Badge variant="secondary">Draft</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <Link href="/admin/content/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Content
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by title or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="tips">Tips</option>
          <option value="tax">Tax</option>
          <option value="budgeting">Budgeting</option>
          <option value="savings">Savings</option>
          <option value="investing">Investing</option>
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ) : filteredContent.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No content found. Create your first article!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContent.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      {item.featured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      )}
                      {getStatusBadge(item.published_at)}
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.view_count} views
                      </span>
                    </div>
                    
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="h-4 w-4 text-gray-400" />
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(item.id, item.featured)}
                      title={item.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      {item.featured ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Link href={`/admin/content/${item.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteContent(item.id)}
                      disabled={deleting === item.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}