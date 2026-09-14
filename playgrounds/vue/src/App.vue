<script setup lang="ts">
import { computed, onUnmounted, shallowRef } from 'vue'
import DashboardPage from './pages/DashboardPage.vue'
import HomePage from './pages/HomePage.vue'
import SettingsPage from './pages/SettingsPage.vue'

const route = shallowRef(window.location.hash.slice(1) || '/')
const onHashChange = () => { route.value = window.location.hash.slice(1) || '/' }
window.addEventListener('hashchange', onHashChange)
onUnmounted(() => window.removeEventListener('hashchange', onHashChange))

const activePage = computed(() => ({
  '/': HomePage,
  '/dashboard': DashboardPage,
  '/settings': SettingsPage,
}[route.value] ?? HomePage))
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
    <main class="page-shell"><component :is="activePage" /></main>
  </div>
</template>
