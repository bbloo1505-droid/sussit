type ConfidenceBlockProps = {
  explanation: string
}

export function ConfidenceBlock({ explanation }: ConfidenceBlockProps) {
  return <p className="text-sm leading-6 text-muted">{explanation}</p>
}
