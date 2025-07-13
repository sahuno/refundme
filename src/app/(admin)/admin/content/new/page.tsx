'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function NewContentPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('tips')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)
  const [publish, setPublish] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean)

    const { data, error } = await supabase
      .from('educational_content')
      .insert({
        title,
        content,
        category,
        tags: tagsArray,
        featured,
        author_id: user.id,
        published_at: publish ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (!error && data) {
      router.push('/admin/content')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Content</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {preview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>{title || 'Untitled'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="tips">Tips</option>
                  <option value="tax">Tax</option>
                  <option value="budgeting">Budgeting</option>
                  <option value="savings">Savings</option>
                  <option value="investing">Investing</option>
                </select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., beginner, tax-tips, financial-planning"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="featured"
                    checked={featured}
                    onCheckedChange={setFeatured}
                  />
                  <Label htmlFor="featured">Featured content</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="publish"
                    checked={publish}
                    onCheckedChange={setPublish}
                  />
                  <Label htmlFor="publish">Publish immediately</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content (Markdown)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content in Markdown format..."
                rows={20}
                className="font-mono"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Supports Markdown formatting: **bold**, *italic*, # Heading, - List items, etc.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/admin/content">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {publish ? 'Publish' : 'Save Draft'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}