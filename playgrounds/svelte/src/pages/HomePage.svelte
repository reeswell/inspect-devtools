<script lang="ts">
  import MetricCard from '../components/MetricCard.svelte'
</script>

<section class="hero-panel">
  <p>Svelte playground · route /</p>
  <h1>Inspect the whole interface.</h1>
  <p class="lede">A compact playground for checking source lookups across links, nested components, controls, and changing state.</p>
  <a class="primary-action" href="#/dashboard">Open dashboard</a>
</section>
<section class="metric-grid" aria-label="Workspace metrics">
  <MetricCard label="Signals" value="24" tone="green" />
  <MetricCard label="Views" value="9" tone="blue" />
  <MetricCard label="Hints" value="6" tone="amber" />
</section>
