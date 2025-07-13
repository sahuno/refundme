import { checkAdminAccess } from '@/lib/auth/admin'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await checkAdminAccess()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">RefundMe Admin</h1>
              <span className="ml-4 text-sm text-gray-500">
                {profile.is_super_admin ? 'Super Admin' : 
                 profile.admin_department ? `${profile.admin_department} Admin` :
                 profile.role === 'administrator' ? 'Administrator' : 'Accountant'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/requests"
                  className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  Reimbursement Requests
                </Link>
              </li>
              {/* Show Users page only for super admin */}
              {profile.is_super_admin && (
                <li>
                  <Link
                    href="/admin/users"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                  >
                    Users
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/admin/reports"
                  className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  Reports
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit"
                  className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  Audit Trail
                </Link>
              </li>
              {/* Show Settings and Content only for super admin */}
              {profile.is_super_admin && (
                <>
                  <li>
                    <Link
                      href="/admin/content"
                      className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                    >
                      Content Management
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                    >
                      Settings
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}