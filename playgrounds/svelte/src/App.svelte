<script lang="ts">
  import { onMount } from 'svelte'
  import DashboardPage from './pages/DashboardPage.svelte'
  import HomePage from './pages/HomePage.svelte'
  import SettingsPage from './pages/SettingsPage.svelte'

  let route = $state(window.location.hash.slice(1) || '/')

  onMount(() => {
    const onHashChange = () => {
      route = window.location.hash.slice(1) || '/'
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })
</script>

<div class="playground-shell">
  <header class="app-header">
    <a class="brand" href="#/">Source Lab</a>
    <nav class="app-nav" aria-label="Playground pages">
      <a href="#/" class:active={route === '/'}>Home</a>
      <a href="#/dashboard" class:active={route === '/dashboard'}>Dashboard</a>
      <a href="#/settings" class:active={route === '/settings'}>Settings</a>
    </nav>
  </header>
  <main class="page-shell">
    {#if route === '/dashboard'}
      <DashboardPage />
    {:else if route === '/settings'}
      <SettingsPage />
    {:else}
      <HomePage />
    {/if}
  </main>
</div>
