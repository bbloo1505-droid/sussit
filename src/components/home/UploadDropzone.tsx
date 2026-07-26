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
    if (!file?.type.startsWith('image/')) return
    onFile(file)
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    handleFiles(event.dataTransfer.files)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/25 bg-surface px-6 py-16 text-center transition-colors hover:border-lime/60 hover:bg-[#1f1f1f]',
          className,
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime text-ink">
          <ImagePlus className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">
          Upload screenshot
        </span>
        <span className="text-sm text-muted">PNG, JPG or HEIC</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleFiles(e.target.files)
        }
      />
    </>
  )
}
