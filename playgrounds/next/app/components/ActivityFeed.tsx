export interface ActivityItem {
  actor: string
  action: string
  time: string
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="activity-feed">
      {items.map(item => (
        <li key={`${item.actor}-${item.time}`} className="activity-item">
          <span className="activity-dot" aria-hidden="true" />
          <div>
            <strong>{item.actor}</strong> {item.action}
            <time>{item.time}</time>
          </div>
        </li>
      ))}
    </ol>
  )
}
