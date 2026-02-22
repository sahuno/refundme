import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()

// Track chained calls per table
function createChainMock() {
  const chains: Record<string, any> = {}

  return {
    from: (table: string) => {
      if (!chains[table]) {
        chains[table] = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return chains[table]
    },
    chains,
    reset: () => {
      Object.keys(chains).forEach((key) => delete chains[key])
    },
  }
}

const chainMock = createChainMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => chainMock.from(table),
  }),
}))

// Mock fetch for email sending
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { POST } from '../../submit-request/route'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/submit-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/submit-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chainMock.reset()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const response = await POST(makeRequest({ request_id: 'req-1' }))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when request_id is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const response = await POST(makeRequest({}))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Request ID is required')
  })

  it('returns 404 when request not found', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const reqChain = chainMock.from('reimbursement_requests')
    reqChain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const response = await POST(makeRequest({ request_id: 'nonexistent' }))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Request not found')
  })

  it('submits request successfully with email skipped (no API key)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    // reimbursement_requests - found
    const reqChain = chainMock.from('reimbursement_requests')
    reqChain.single.mockResolvedValueOnce({
      data: { id: 'req-1', total_amount: 50.0, user_id: 'user-1' },
      error: null,
    })

    // profiles
    const profileChain = chainMock.from('profiles')
    profileChain.single.mockResolvedValue({
      data: { full_name: 'Jane Doe', admin_email: null, department: 'CS' },
      error: null,
    })

    // reimbursement_items
    const itemsChain = chainMock.from('reimbursement_items')
    itemsChain.eq.mockReturnValue({
      then: (cb: any) =>
        cb({
          data: [{ description: 'Book', amount: 50, date: '2025-01-01', category: 'Supplies' }],
          error: null,
        }),
    })
    // Make items return data directly (no .single())
    itemsChain.select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ description: 'Book', amount: 50, date: '2025-01-01', category: 'Supplies' }],
        error: null,
      }),
    })

    // admin_settings - no auto-approval
    const settingsChain = chainMock.from('admin_settings')
    settingsChain.single.mockResolvedValue({ data: null, error: null })

    // update call (chained with .eq().eq().eq())
    reqChain.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    const response = await POST(makeRequest({ request_id: 'req-1' }))
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.message).toBe('Request submitted successfully')
  })
})
