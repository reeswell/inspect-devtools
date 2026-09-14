<script setup lang="ts">
import { shallowRef } from 'vue'
import ActivityFeed from '../components/ActivityFeed.vue'
import MetricCard from '../MetricCard.vue'

const deployed = shallowRef(false)
const activities = [
  { actor: 'Mina Chen', action: 'merged the search filters', time: '8m ago' },
  { actor: 'Ari Singh', action: 'updated the release notes', time: '26m ago' },
  { actor: 'Build bot', action: 'published preview #184', time: '1h ago' },
]
</script>

<template>
  <section class="page-heading"><div><p>Route /dashboard</p><h1>Release overview</h1></div><button type="button" @click="deployed = !deployed">{{ deployed ? 'Deployed' : 'Deploy preview' }}</button></section>
  <section class="metric-grid"><MetricCard label="Open pull requests" value="12" tone="blue" /><MetricCard label="Passing checks" value="98%" tone="green" /><MetricCard label="Needs review" value="4" tone="amber" /></section>
  <section class="content-grid"><article class="content-panel"><h2>Recent activity</h2><ActivityFeed :items="activities" /></article><article class="content-panel"><h2>Deploy status</h2><p class="status-copy">{{ deployed ? 'Preview deployment is live and ready for review.' : 'No preview is currently deployed.' }}</p><a href="#/settings">Review workspace settings</a></article></section>
</template>
