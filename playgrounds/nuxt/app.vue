<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'

const route = shallowRef('/')

const onHashChange = () => {
  if (typeof window !== 'undefined') {
    route.value = window.location.hash.slice(1) || '/'
  }
}

onMounted(() => {
  onHashChange()
  window.addEventListener('hashchange', onHashChange)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('hashchange', onHashChange)
  }
})

const deployed = shallowRef(false)
const activities = [
  { actor: 'Mina Chen', action: 'merged the search filters', time: '8m ago' },
  { actor: 'Ari Singh', action: 'updated the release notes', time: '26m ago' },
  { actor: 'Build bot', action: 'published preview #184', time: '1h ago' },
]
</script>

<template>
  <div class="playground-shell">
    <header class="app-header">
      <a class="brand" href="#/">Source Lab</a>
      <nav class="app-nav" aria-label="Playground pages">
        <a href="#/" :class="{ active: route === '/' }">Home</a>
        <a href="#/dashboard" :class="{ active: route === '/dashboard' }">Dashboard</a>
        <a href="#/settings" :class="{ active: route === '/settings' }">Settings</a>
      </nav>
    </header>
    <main class="page-shell">
      <template v-if="route === '/dashboard'">
        <section class="page-heading">
          <div>
            <p>Route /dashboard</p>
            <h1>Release overview</h1>
          </div>
          <button type="button" @click="deployed = !deployed">
            {{ deployed ? 'Deployed' : 'Deploy preview' }}
          </button>
        </section>
        <section class="metric-grid">
          <MetricCard label="Open pull requests" value="12" tone="blue" />
          <MetricCard label="Passing checks" value="98%" tone="green" />
          <MetricCard label="Needs review" value="4" tone="amber" />
        </section>
        <section class="content-grid">
          <article class="content-panel">
            <h2>Recent activity</h2>
            <ActivityFeed :items="activities" />
          </article>
          <article class="content-panel">
            <h2>Deploy status</h2>
            <p class="status-copy">
              {{ deployed ? 'Preview deployment is live and ready for review.' : 'No preview is currently deployed.' }}
            </p>
            <a href="#/settings">Review workspace settings</a>
          </article>
        </section>
      </template>

      <template v-else-if="route === '/settings'">
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
      </template>

      <template v-else>
        <section class="hero-panel">
          <p>Nuxt playground · route /</p>
          <h1>Inspect the whole interface.</h1>
          <p class="lede">A compact playground for checking source lookups across links, nested components, controls, and changing state.</p>
          <a class="primary-action" href="#/dashboard">Open dashboard</a>
        </section>
        <section class="metric-grid" aria-label="Workspace metrics">
          <MetricCard label="Signals" value="24" tone="green" />
          <MetricCard label="Views" value="9" tone="blue" />
          <MetricCard label="Hints" value="6" tone="amber" />
        </section>
      </template>
    </main>
  </div>
</template>
