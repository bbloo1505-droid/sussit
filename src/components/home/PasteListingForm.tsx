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
        className="w-full text-center text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Paste listing text instead
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
      <label className="block text-sm font-medium text-ink/80" htmlFor="listing-text">
        Paste listing text
      </label>
      <textarea
        id="listing-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Meta Quest 3 512GB&#10;$550&#10;Used, controllers included…"
        className="w-full resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-ink/30"
      />
      <Button type="submit" className="w-full" disabled={!text.trim()}>
        Continue
      </Button>
    </form>
  )
}
