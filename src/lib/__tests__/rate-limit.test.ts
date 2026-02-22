import { describe, it, expect } from 'vitest'
import rateLimit from '../rate-limit'

describe('rateLimit', () => {
  it('allows requests under the limit', async () => {
    const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 })
    await expect(limiter.check(5, 'user-1')).resolves.toBeUndefined()
  })

  it('tracks separate tokens independently', async () => {
    const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 })

    // Both users should be allowed
    await expect(limiter.check(3, 'user-a')).resolves.toBeUndefined()
    await expect(limiter.check(3, 'user-b')).resolves.toBeUndefined()
  })

  it('rejects when rate limit is exceeded', async () => {
    const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 })

    // Use limit of 3, so 1st and 2nd calls succeed, 3rd rejects
    await limiter.check(3, 'user-x')
    await limiter.check(3, 'user-x')

    await expect(limiter.check(3, 'user-x')).rejects.toBeDefined()
  })

  it('returns 429 status in the rejection response', async () => {
    const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 })

    await limiter.check(2, 'user-y')

    try {
      await limiter.check(2, 'user-y')
      expect.fail('Should have rejected')
    } catch (response: any) {
      expect(response.status).toBe(429)
      const body = await response.json()
      expect(body.error).toBe('Rate limit exceeded')
    }
  })

  it('uses default options when none provided', async () => {
    const limiter = rateLimit()
    await expect(limiter.check(100, 'default-user')).resolves.toBeUndefined()
  })

  it('does not rate limit different tokens against each other', async () => {
    const limiter = rateLimit({ uniqueTokenPerInterval: 10, interval: 60000 })

    // Exhaust token for user-1
    await limiter.check(2, 'exhaust-1')
    await expect(limiter.check(2, 'exhaust-1')).rejects.toBeDefined()

    // user-2 should still be fine
    await expect(limiter.check(2, 'exhaust-2')).resolves.toBeUndefined()
  })
})
