<script lang="ts">
  import SettingsForm from '../components/SettingsForm.svelte'
</script>

<section class="page-heading">
  <div>
    <p>Route /settings</p>
    <h1>Workspace settings</h1>
  </div>
</section>
<section class="settings-layout">
  <article class="content-panel">
    <h2>General</h2>
    <p class="status-copy">Configure the defaults shared by this workspace.</p>
    <SettingsForm />
  </article>
  <aside class="help-panel">
    <h2>Testing targets</h2>
    <p>Inspect the inputs, select, checkbox, action button, and success state to exercise source resolution.</p>
  </aside>
</section>
