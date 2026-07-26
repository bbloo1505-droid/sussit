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
    <AppShell className="justify-between gap-8">
      <BrandMark showTagline />

      <div className="flex-1 space-y-7 pt-6">
        <div className="space-y-3">
          <h1 className="font-display text-[2.125rem] font-extrabold leading-[1.15] tracking-[-0.5px]">
            Should I buy this?
          </h1>
          <p className="text-base leading-6 text-muted">
            Upload the listing. We&apos;ll suss it out.
          </p>
        </div>

        <UploadDropzone onFile={goConfirm} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            Or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <PasteListingForm onSubmit={goConfirm} />
      </div>

      <p className="text-center text-xs text-muted">No signup needed.</p>
    </AppShell>
  )
}
