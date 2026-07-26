import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
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
    <AppShell className="gap-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="rounded-full p-2 hover:bg-white/5" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to="/" className="rounded-full p-2 hover:bg-white/5" aria-label="Close">
          <X className="h-5 w-5" />
        </Link>
      </div>

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
          <div className="mt-auto space-y-3 pt-6">
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
              variant="secondary"
              size="lg"
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
