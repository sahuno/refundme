import { vi } from 'vitest'

// Mock next/server
vi.mock('next/server', () => {
  class MockNextResponse {
    body: string | null
    status: number
    headers: Map<string, string>

    constructor(body: string | null, init?: { status?: number; headers?: Record<string, string> | Map<string, string> }) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Map()
      if (init?.headers) {
        if (init.headers instanceof Map) {
          this.headers = init.headers
        } else {
          Object.entries(init.headers).forEach(([k, v]) => this.headers.set(k, v))
        }
      }
    }

    async json() {
      return this.body ? JSON.parse(this.body) : null
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      const response = new MockNextResponse(JSON.stringify(data), init)
      response.json = async () => data
      return response
    }

    static next() {
      const response = new MockNextResponse(null, { status: 200 })
      return response
    }

    static redirect(url: URL | string) {
      const response = new MockNextResponse(null, { status: 307 })
      ;(response as any).redirectUrl = typeof url === 'string' ? url : url.toString()
      return response
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: vi.fn(),
  }
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))
