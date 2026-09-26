export interface MetricCardProps {
  label: string
  value: string
  tone: 'green' | 'blue' | 'amber'
}

export function MetricCard({ label, value, tone }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
