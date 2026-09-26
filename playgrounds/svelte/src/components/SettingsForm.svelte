<script lang="ts">
  let notifications = $state(true)
  let saved = $state(false)

  function save(event: SubmitEvent) {
    event.preventDefault()
    saved = true
  }
</script>

<form class="settings-form" onsubmit={save}>
  <label>
    <span>Workspace name</span>
    <input value="Source Lab" name="workspace" />
  </label>
  <label>
    <span>Default branch</span>
    <select name="branch">
      <option>main</option>
      <option>develop</option>
    </select>
  </label>
  <label class="switch-row">
    <span>Build notifications</span>
    <input bind:checked={notifications} type="checkbox" />
  </label>
  <div class="form-actions">
    <button type="submit">Save settings</button>
    {#if saved}
      <span role="status">Saved</span>
    {/if}
  </div>
</form>
