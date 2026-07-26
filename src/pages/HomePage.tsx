import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BrandMark } from '@/components/layout/BrandMark'
import { UploadDropzone } from '@/components/home/UploadDropzone'
import { PasteListingForm } from '@/components/home/PasteListingForm'

export function HomePage() {
  const navigate = useNavigate()

  function goConfirm() {
    navigate('/confirm')
  }

  return (
    <AppShell className="justify-between gap-10">
      <div>
        <BrandMark />
        <p className="mt-2 text-sm text-muted">Know before you buy.</p>
      </div>

      <div className="flex-1 space-y-8 pt-8">
        <div className="space-y-3">
          <h1 className="font-display text-[3.25rem] font-extrabold leading-[0.95] tracking-tight">
            Should I
            <br />
            buy this?
          </h1>
          <p className="max-w-xs text-base leading-relaxed text-muted">
            Upload the listing. We&apos;ll suss it out.
          </p>
        </div>

        <UploadDropzone onFile={goConfirm} />
        <PasteListingForm onSubmit={goConfirm} />
      </div>

      <p className="text-center text-xs text-muted">
        Works with Marketplace · Gumtree · eBay
      </p>
    </AppShell>
  )
}
