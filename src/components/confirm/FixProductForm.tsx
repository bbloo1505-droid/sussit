import { useState } from 'react'
import { Button } from '@/components/ui/button'

type FixProductFormProps = {
  initialName: string
  onCancel: () => void
  onSave: (name: string) => void
}

export function FixProductForm({
  initialName,
  onCancel,
  onSave,
}: FixProductFormProps) {
  const [name, setName] = useState(initialName)

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return
        onSave(trimmed)
      }}
    >
      <div>
        <label htmlFor="product-name" className="text-sm text-muted">
          Correct product
        </label>
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-base text-white outline-none focus:border-lime/50"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </form>
  )
}
