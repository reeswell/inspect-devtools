<script lang="ts">
  interface Props {
    label: string
    value: string
    tone: 'green' | 'blue' | 'amber'
  }

  let { label, value, tone }: Props = $props()
</script>

<article class="metric-card metric-card-{tone}">
  <span>{label}</span>
  <strong>{value}</strong>
</article>
