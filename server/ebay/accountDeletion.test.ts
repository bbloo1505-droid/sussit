import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildEbayChallengeResponse } from './accountDeletion.ts'
import { handleEbayAccountDeletionRequest } from '../handleEbayAccountDeletion.ts'

describe('buildEbayChallengeResponse', () => {
  it('hashes challengeCode + verificationToken + endpoint in that order', () => {
    const challengeCode = 'abc123'
    const verificationToken = 'a'.repeat(32)
    const endpoint = 'https://sussit.vercel.app/api/ebay/account-deletion'

    const expected = createHash('sha256')
      .update(challengeCode + verificationToken + endpoint, 'utf8')
      .digest('hex')

    expect(
      buildEbayChallengeResponse({
        challengeCode,
        verificationToken,
        endpoint,
      }),
    ).toBe(expected)
  })
})

describe('handleEbayAccountDeletionRequest', () => {
  beforeEach(() => {
    process.env.EBAY_DELETION_VERIFICATION_TOKEN = 'v'.repeat(40)
    process.env.EBAY_DELETION_ENDPOINT =
      'https://sussit.vercel.app/api/ebay/account-deletion'
  })

  it('returns valid challenge response for GET', async () => {
    const challengeCode = 'test-challenge-001'
    const result = await handleEbayAccountDeletionRequest({
      method: 'GET',
      challengeCode,
    })

    expect(result.status).toBe(200)
    const body = result.body as { challengeResponse: string }
    expect(body.challengeResponse).toBe(
      buildEbayChallengeResponse({
        challengeCode,
        verificationToken: process.env.EBAY_DELETION_VERIFICATION_TOKEN!,
        endpoint: process.env.EBAY_DELETION_ENDPOINT!,
      }),
    )
  })

  it('rejects GET without challenge_code', async () => {
    const result = await handleEbayAccountDeletionRequest({
      method: 'GET',
      challengeCode: null,
    })
    expect(result.status).toBe(400)
  })

  it('acknowledges valid MARKETPLACE_ACCOUNT_DELETION POST', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    const result = await handleEbayAccountDeletionRequest({
      method: 'POST',
      body: {
        metadata: { topic: 'MARKETPLACE_ACCOUNT_DELETION' },
        notification: {
          notificationId: 'note-1',
          data: {
            username: 'seller123',
            userId: 'uid-9',
            eiasToken: 'eias-xyz',
          },
        },
      },
    })

    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      ok: true,
      topic: 'MARKETPLACE_ACCOUNT_DELETION',
      action: 'NO_LINKABLE_DATA',
    })
    expect(log).toHaveBeenCalled()
    const logged = log.mock.calls[0]?.[1] as Record<string, unknown>
    expect(logged).not.toHaveProperty('username')
    expect(logged).not.toHaveProperty('userId')
    expect(logged).not.toHaveProperty('eiasToken')
    expect(logged).toHaveProperty('identifierFingerprint')
    log.mockRestore()
  })

  it('rejects malformed POST payload', async () => {
    const result = await handleEbayAccountDeletionRequest({
      method: 'POST',
      body: 'not-json-object',
    })
    expect(result.status).toBe(400)

    const missingTopic = await handleEbayAccountDeletionRequest({
      method: 'POST',
      body: { notification: {} },
    })
    expect(missingTopic.status).toBe(400)
  })

  it('rejects unexpected notification topic', async () => {
    const result = await handleEbayAccountDeletionRequest({
      method: 'POST',
      body: {
        metadata: { topic: 'SOME_OTHER_TOPIC' },
        notification: { data: {} },
      },
    })
    expect(result.status).toBe(400)
    expect(JSON.stringify(result.body)).toMatch(/Unexpected notification topic/)
  })
})
