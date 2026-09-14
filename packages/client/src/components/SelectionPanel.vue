<script setup lang="ts">
import type { GrabSelection } from '@inspect-devtools/core'

const props = defineProps<{
  selection: GrabSelection | null
  isOpening: boolean
}>()

const emit = defineEmits<{
  copyLocation: []
  openInEditor: []
}>()

const displayFileLocation = (filePath: string, line?: number, column?: number): string => {
  const normalized = filePath.replace(/\\/g, '/')
  const srcIndex = normalized.lastIndexOf('/src/')
  const displayPath = srcIndex >= 0 ? normalized.slice(srcIndex + 1) : normalized.split('/').slice(-2).join('/')
  return `${displayPath}${line ? `:${line}` : ''}${column ? `:${column}` : ''}`
}

</script>

<template>
  <section class="surface selection-panel">
    <div class="section-heading">
      <h2>Selection</h2>
      <div class="section-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="!selection?.filePath"
          :title="selection?.filePath ? 'Copy source location' : 'Select an element with a source file first'"
          @click="emit('copyLocation')"
        >
          Copy
        </button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!selection?.filePath || isOpening"
          :title="selection?.filePath ? 'Open source in editor' : 'Select an element with a source file first'"
          @click="emit('openInEditor')"
        >
          {{ isOpening ? 'Opening…' : 'Open' }}
        </button>
      </div>
    </div>

    <div v-if="selection" class="selection-grid">
      <span>Component</span>
      <strong>{{ selection.componentName || selection.tagName }}</strong>
      <span>File</span>
      <strong
        v-if="selection.filePath"
        class="file-location"
        :title="selection.filePath"
      >
        {{ displayFileLocation(selection.filePath, selection.line, selection.column) }}
      </strong>
      <strong v-else class="file-location-unavailable">Source file unavailable</strong>
      <span>Line</span>
      <strong>{{ selection.line || '-' }}</strong>
      <span>Selector</span>
      <strong>{{ selection.cssSelector || '-' }}</strong>
    </div>

    <p v-if="selection?.filePath" class="file-hint">Source location copied and opened automatically when selected</p>

    <p v-else class="empty-copy">Click Inspect, then select an element in the app.</p>
  </section>
</template>
