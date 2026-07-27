import { describe, expect, it } from 'vitest'
import { mapBrowseItem } from './mapBrowseItem.ts'

describe('mapBrowseItem', () => {
  it('maps an AU used Browse summary into a comparable', () => {
    const row = mapBrowseItem({
      itemId: 'v1|123|0',
      title: 'Meta Quest 3 512GB used',
      price: { value: '549.00', currency: 'AUD' },
      condition: 'Used',
      conditionId: '3000',
      itemWebUrl: 'https://www.ebay.com.au/itm/123',
      itemLocation: { city: 'Sydney', country: 'AU' },
      shippingOptions: [{ shippingCost: { value: '0.00', currency: 'AUD' } }],
      estimatedAvailabilities: [
        { estimatedAvailableQuantity: 1, estimatedSoldQuantity: 0 },
      ],
      itemCreationDate: '2026-07-20T00:00:00.000Z',
    })

    expect(row).not.toBeNull()
    expect(row!.source).toBe('ebay')
    expect(row!.externalId).toBe('v1|123|0')
    expect(row!.price).toBe(549)
    expect(row!.currency).toBe('AUD')
    expect(row!.location).toContain('Sydney')
    expect(row!.estimatedAvailableQuantity).toBe(1)
    expect(row!.itemCreatedAt).toBe('2026-07-20T00:00:00.000Z')
  })

  it('returns null when price is missing', () => {
    expect(
      mapBrowseItem({
        itemId: 'x',
        title: 'No price',
      }),
    ).toBeNull()
  })
})
