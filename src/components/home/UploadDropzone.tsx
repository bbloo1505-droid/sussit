import { useRef, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadDropzoneProps = {
  onFile: (file: File) => void
  className?: string
}

export function UploadDropzone({ onFile, className }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    onFile(file)
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    handleFiles(event.dataTransfer.files)
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-white px-6 py-14 text-center transition-colors hover:border-ink/40 hover:bg-white',
          className,
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-lime">
          <ImagePlus className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Upload screenshot
        </span>
        <span className="max-w-[16rem] text-sm text-muted">
          Marketplace, Gumtree, eBay — drop a listing photo here
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </>
  )
}
