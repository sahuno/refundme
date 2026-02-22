import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server client
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      select: (...args: any[]) => {
        mockSelect(...args)
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs)
            return { single: mockSingle }
          },
        }
      },
    }),
  }),
}))

import { isAdmin, isSuperAdmin, getAdminDepartment, checkAdminAccess } from '../admin'

describe('isAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for administrator role', async () => {
    mockSingle.mockResolvedValue({
      data: { role: 'administrator', is_super_admin: false },
    })

    expect(await isAdmin('user-1')).toBe(true)
  })

  it('returns true for accountant role', async () => {
    mockSingle.mockResolvedValue({
      data: { role: 'accountant', is_super_admin: false },
    })

    expect(await isAdmin('user-2')).toBe(true)
  })

  it('returns true for super admin regardless of role', async () => {
    mockSingle.mockResolvedValue({
      data: { role: 'student', is_super_admin: true },
    })

    expect(await isAdmin('user-3')).toBe(true)
  })

  it('returns false for student role', async () => {
    mockSingle.mockResolvedValue({
      data: { role: 'student', is_super_admin: false },
    })

    expect(await isAdmin('user-4')).toBe(false)
  })

  it('returns false when profile not found', async () => {
    mockSingle.mockResolvedValue({ data: null })

    expect(await isAdmin('nonexistent')).toBe(false)
  })
})

describe('isSuperAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when is_super_admin is true', async () => {
    mockSingle.mockResolvedValue({
      data: { is_super_admin: true },
    })

    expect(await isSuperAdmin('user-1')).toBe(true)
  })

  it('returns false when is_super_admin is false', async () => {
    mockSingle.mockResolvedValue({
      data: { is_super_admin: false },
    })

    expect(await isSuperAdmin('user-2')).toBe(false)
  })

  it('returns false when profile not found', async () => {
    mockSingle.mockResolvedValue({ data: null })

    expect(await isSuperAdmin('nonexistent')).toBe(false)
  })
})

describe('getAdminDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for super admin (access to all departments)', async () => {
    mockSingle.mockResolvedValue({
      data: { admin_department: 'Engineering', is_super_admin: true },
    })

    expect(await getAdminDepartment('super-admin')).toBeNull()
  })

  it('returns department for regular admin', async () => {
    mockSingle.mockResolvedValue({
      data: { admin_department: 'Engineering', is_super_admin: false },
    })

    expect(await getAdminDepartment('admin-1')).toBe('Engineering')
  })

  it('returns null when no department assigned', async () => {
    mockSingle.mockResolvedValue({
      data: { admin_department: null, is_super_admin: false },
    })

    expect(await getAdminDepartment('admin-2')).toBeNull()
  })

  it('returns null when profile not found', async () => {
    mockSingle.mockResolvedValue({ data: null })

    expect(await getAdminDepartment('nonexistent')).toBeNull()
  })
})

describe('checkAdminAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    await expect(checkAdminAccess()).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects to /dashboard when user is a student', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'student-1' } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: { role: 'student', is_super_admin: false, admin_department: null },
    })

    await expect(checkAdminAccess()).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  it('returns user and profile for administrator', async () => {
    const mockUser = { id: 'admin-1', email: 'admin@test.com' }
    const mockProfile = { role: 'administrator', is_super_admin: false, admin_department: 'CS' }

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSingle.mockResolvedValue({ data: mockProfile })

    const result = await checkAdminAccess()
    expect(result.user).toEqual(mockUser)
    expect(result.profile).toEqual(mockProfile)
  })
})
