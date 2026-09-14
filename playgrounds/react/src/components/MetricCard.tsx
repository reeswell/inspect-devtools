interface MetricCardProps { label: string; value: string; tone: 'green' | 'blue' | 'amber' }
export const MetricCard = ({ label, value, tone }: MetricCardProps) => <article className={`metric-card metric-card-${tone}`}><span>{label}</span><strong>{value}</strong></article>
