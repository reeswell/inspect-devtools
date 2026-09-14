<script setup lang="ts">
defineProps<{
  label: string
  value: string
  tone: 'green' | 'blue' | 'amber'
}>()
</script>

<template>
  <article class="metric-card" :class="`metric-card-${tone}`">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </article>
</template>
