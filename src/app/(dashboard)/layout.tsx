'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard/transactions')}>
              Transactions
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard/requests')}>
              Requests
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard/settings')}>
              Settings
            </Button>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-6">{children}</main>
    </div>
  )
} 