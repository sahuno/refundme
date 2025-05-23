'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

async function logout() {
  'use server'
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  return { redirect: '/login' }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-lg">RefundMe Dashboard</div>
        <nav className="space-x-4">
          <Link href="/dashboard" className="hover:underline">Home</Link>
          <Link href="/dashboard/transactions" className="hover:underline">Transactions</Link>
        </nav>
        <form action={logout} method="post">
          <button type="submit" className="ml-4 px-3 py-1 bg-red-600 rounded hover:bg-red-700">Logout</button>
        </form>
      </header>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  )
} 