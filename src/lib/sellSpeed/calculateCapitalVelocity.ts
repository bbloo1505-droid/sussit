import type { CapitalVelocity, SellSpeedEstimate } from '@/types/sellSpeed'

export function calculateCapitalVelocity(input: {
  buyPrice: number
  resaleLow: number
  resaleHigh: number
  sellSpeed: SellSpeedEstimate
}): CapitalVelocity {
  const expectedResaleMid = (input.resaleLow + input.resaleHigh) / 2
  const expectedProfit = expectedResaleMid - input.buyPrice
  const expectedDaysMid =
    input.sellSpeed.estimatedDaysLow != null &&
    input.sellSpeed.estimatedDaysHigh != null
      ? (input.sellSpeed.estimatedDaysLow + input.sellSpeed.estimatedDaysHigh) / 2
      : null

  if (expectedDaysMid == null || expectedDaysMid <= 0 || expectedProfit <= 0) {
    return {
      profitPerDay: null,
      label: 'UNKNOWN',
      buyPrice: input.buyPrice,
      expectedResaleMid: Math.round(expectedResaleMid),
      expectedProfit: Math.round(expectedProfit),
      expectedDaysMid,
    }
  }

  const profitPerDay = Number((expectedProfit / expectedDaysMid).toFixed(1))
  const label =
    profitPerDay >= 25
      ? 'EXCELLENT'
      : profitPerDay >= 15
        ? 'GOOD'
        : profitPerDay >= 7
          ? 'FAIR'
          : 'POOR'

  return {
    profitPerDay,
    label,
    buyPrice: input.buyPrice,
    expectedResaleMid: Math.round(expectedResaleMid),
    expectedProfit: Math.round(expectedProfit),
    expectedDaysMid: Number(expectedDaysMid.toFixed(1)),
  }
}
