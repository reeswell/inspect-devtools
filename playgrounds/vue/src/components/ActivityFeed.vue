<script setup lang="ts">
defineProps<{ items: Array<{ actor: string, action: string, time: string }> }>()
</script>

<template>
  <ol class="activity-feed">
    <li v-for="item in items" :key="`${item.actor}-${item.time}`" class="activity-item">
      <span class="activity-dot" aria-hidden="true" />
      <div><strong>{{ item.actor }}</strong> {{ item.action }}<time>{{ item.time }}</time></div>
    </li>
  </ol>
</template>
