import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BrandMark } from '@/components/layout/BrandMark'
import { ProductSummary } from '@/components/confirm/ProductSummary'
import { FixProductForm } from '@/components/confirm/FixProductForm'
import { Button } from '@/components/ui/button'
import { MOCK_ANALYSIS_ID, quest3512Analysis } from '@/mocks/quest3-512'

export function ConfirmPage() {
  const navigate = useNavigate()
  const [fixing, setFixing] = useState(false)
  const [productName, setProductName] = useState(quest3512Analysis.productName)

  const analysis = { ...quest3512Analysis, productName }

  return (
    <AppShell className="gap-8">
      <BrandMark />

      {fixing ? (
        <FixProductForm
          initialName={productName}
          onCancel={() => setFixing(false)}
          onSave={(name) => {
            setProductName(name)
            setFixing(false)
          }}
        />
      ) : (
        <>
          <ProductSummary analysis={analysis} />

          <div className="mt-auto space-y-3 pt-8">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => navigate(`/analysing?id=${MOCK_ANALYSIS_ID}`)}
            >
              Yes, that&apos;s right
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setFixing(true)}
            >
              Fix product
            </Button>
          </div>
        </>
      )}
    </AppShell>
  )
}
