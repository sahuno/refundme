'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-lg">RefundMe Dashboard</div>
        <nav className="space-x-4">
          <Link href="/dashboard" className="hover:underline">Home</Link>
          <Link href="/dashboard/transactions" className="hover:underline">Transactions</Link>
          <Link href="/dashboard/requests" className="hover:underline">Requests</Link>
        </nav>
        <button
          onClick={handleLogout}
          className="ml-4 px-3 py-1 bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </header>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  )
} 