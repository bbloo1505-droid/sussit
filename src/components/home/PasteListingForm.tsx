import { useState } from 'react'
import { Button } from '@/components/ui/button'

type PasteListingFormProps = {
  onSubmit: (text: string) => void
}

export function PasteListingForm({ onSubmit }: PasteListingFormProps) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-white/15 bg-surface px-4 py-3.5 text-center text-sm font-semibold text-white hover:bg-[#222]"
      >
        Paste listing text
      </button>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = text.trim()
        if (!trimmed) return
        onSubmit(trimmed)
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Meta Quest 3 512GB&#10;$550&#10;Used, controllers included…"
        className="w-full resize-none rounded-2xl border border-white/10 bg-surface px-4 py-3 text-base text-white outline-none placeholder:text-muted focus:border-lime/50"
      />
      <Button type="submit" className="w-full" disabled={!text.trim()}>
        Continue
      </Button>
    </form>
  )
}
