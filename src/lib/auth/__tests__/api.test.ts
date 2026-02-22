import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

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

import { requireAuth, requireAdminAuth } from '../api'

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const result = await requireAuth()
    expect(result).toHaveProperty('status', 401)
    const body = await (result as any).json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns user and supabase client when authenticated', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const result = await requireAuth()
    expect(result).toHaveProperty('user')
    expect(result).toHaveProperty('supabase')
    expect((result as any).user).toEqual(mockUser)
  })
})

describe('requireAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const result = await requireAdminAuth()
    expect(result).toHaveProperty('status', 401)
  })

  it('returns 403 when user is not admin', async () => {
    const mockUser = { id: 'student-1', email: 'student@test.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSingle.mockResolvedValue({
      data: { role: 'student', is_super_admin: false, admin_department: null },
    })

    const result = await requireAdminAuth()
    expect(result).toHaveProperty('status', 403)
    const body = await (result as any).json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns user and profile for administrator', async () => {
    const mockUser = { id: 'admin-1', email: 'admin@test.com' }
    const mockProfile = { role: 'administrator', is_super_admin: false, admin_department: 'CS' }

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSingle.mockResolvedValue({ data: mockProfile })

    const result = await requireAdminAuth()
    expect(result).toHaveProperty('user')
    expect(result).toHaveProperty('profile')
    expect((result as any).user).toEqual(mockUser)
    expect((result as any).profile).toEqual(mockProfile)
  })

  it('returns user and profile for accountant', async () => {
    const mockUser = { id: 'acct-1', email: 'accountant@test.com' }
    const mockProfile = { role: 'accountant', is_super_admin: false, admin_department: 'Finance' }

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSingle.mockResolvedValue({ data: mockProfile })

    const result = await requireAdminAuth()
    expect(result).toHaveProperty('user')
    expect((result as any).profile.role).toBe('accountant')
  })

  it('returns 403 when profile not found', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockSingle.mockResolvedValue({ data: null })

    const result = await requireAdminAuth()
    expect(result).toHaveProperty('status', 403)
  })
})
