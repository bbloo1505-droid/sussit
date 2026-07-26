type VerdictHeaderProps = {
  label: string
  productName: string
}

export function VerdictHeader({ label, productName }: VerdictHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="font-display text-5xl font-extrabold tracking-tight text-good">
        {label}
      </p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        {productName}
      </h1>
    </header>
  )
}
