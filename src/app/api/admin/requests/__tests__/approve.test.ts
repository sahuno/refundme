import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockIsAdmin = vi.fn()
const mockNotify = vi.fn()

// Supabase chain mocks
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'reimbursement_requests') {
        return {
          update: mockUpdate.mockReturnValue({
            eq: mockEq.mockReturnValue({
              select: mockSelect.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        }
      }
      if (table === 'notifications') {
        return { insert: mockInsert.mockResolvedValue({ error: null }) }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() }
    },
  }),
}))

vi.mock('@/lib/auth/admin', () => ({
  isAdmin: (...args: any[]) => mockIsAdmin(...args),
}))

vi.mock('@/lib/email/notifications', () => ({
  notifyStudentOfStatusChange: (...args: any[]) => mockNotify(...args),
}))

import { POST } from '@/app/api/admin/requests/[id]/approve/route'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/admin/requests/req-1/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const mockParams = Promise.resolve({ id: 'req-1' })

describe('POST /api/admin/requests/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotify.mockResolvedValue({ success: true })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const response = await POST(makeRequest({}), { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'student-1' } },
      error: null,
    })
    mockIsAdmin.mockResolvedValue(false)

    const response = await POST(makeRequest({}), { params: mockParams })
    expect(response.status).toBe(401)
  })

  it('returns 500 when database update fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    })
    mockIsAdmin.mockResolvedValue(true)
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    })

    const response = await POST(makeRequest({ admin_notes: 'Looks good' }), {
      params: mockParams,
    })
    expect(response.status).toBe(500)
  })

  it('approves request successfully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    })
    mockIsAdmin.mockResolvedValue(true)
    mockSingle.mockResolvedValue({
      data: {
        id: 'req-1',
        user_id: 'student-1',
        total_amount: 150.0,
        status: 'approved',
      },
      error: null,
    })

    const response = await POST(makeRequest({ admin_notes: 'Approved' }), {
      params: mockParams,
    })
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.message).toBe('Request approved successfully')

    // Should create notification
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-1',
        type: 'request_approved',
        title: 'Reimbursement Request Approved',
      })
    )

    // Should send email notification
    expect(mockNotify).toHaveBeenCalledWith('req-1', 'approved', 'Approved')
  })
})
