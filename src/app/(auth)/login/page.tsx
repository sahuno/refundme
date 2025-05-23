'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toast } from '@/components/ui/toast'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({ open: false, title: '', description: '' })
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      setToast({ open: true, title: 'Success', description: 'Logged in successfully.' })
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    } catch (error: any) {
      setToast({ open: true, title: 'Login failed', description: error.message || 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Toast open={toast.open} onOpenChange={o => setToast(t => ({ ...t, open: o }))} title={toast.title} description={toast.description} />
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                {...register('password')}
                disabled={loading}
              />
              {errors.password && <p className="text-red-600 text-xs">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
            <p className="text-sm text-center">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 