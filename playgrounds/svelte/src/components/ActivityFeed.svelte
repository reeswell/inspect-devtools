<script lang="ts">
  interface ActivityItem {
    actor: string
    action: string
    time: string
  }

  interface Props {
    items: ActivityItem[]
  }

  let { items }: Props = $props()
</script>

<ol class="activity-feed">
  {#each items as item (`${item.actor}-${item.time}`)}
    <li class="activity-item">
      <span class="activity-dot" aria-hidden="true"></span>
      <div>
        <strong>{item.actor}</strong> {item.action}
        <time>{item.time}</time>
      </div>
    </li>
  {/each}
</ol>
