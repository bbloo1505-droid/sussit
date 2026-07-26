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
        <label htmlFor="product-name" className="text-sm font-medium text-muted">
          Correct product
        </label>
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-ink/30"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </form>
  )
}
