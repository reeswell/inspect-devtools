<script setup lang="ts">
import type { ClientInspectDevtoolsOptions } from '@inspect-devtools/core'
import { nextTick, shallowRef, useTemplateRef } from 'vue'
import SelectionPanel from './components/SelectionPanel.vue'
import { useInspector } from './composables/useInspector'

const props = defineProps<{
  options: ClientInspectDevtoolsOptions
}>()

const isOpen = shallowRef(false)
const panelButton = useTemplateRef<HTMLButtonElement>('panelButton')
const panelHeading = useTemplateRef<HTMLHeadingElement>('panelHeading')
const togglePanel = async () => {
  isOpen.value = !isOpen.value
  await nextTick()
  if (isOpen.value) panelHeading.value?.focus()
  else panelButton.value?.focus()
}
const inspector = useInspector(props.options, { onInspectStart: () => { isOpen.value = true }, onTogglePanel: togglePanel })
const {
  isInspecting,
  feedback,
  isOpening,
  labelStyle,
  lastError,
  copySelectionLocation,
  openActiveSelectionInEditor,
  openSelectionInEditor,
  overlayStyle,
  selection,
  sourceLabel,
  startInspecting,
  stopInspecting,
} = inspector

</script>

<template>
  <div class="inspect-devtools-root" data-inspect-devtools="true">
    <div class="inspector-frame" :style="overlayStyle" />

    <button
      v-if="sourceLabel"
      v-show="sourceLabel.canOpen"
      class="source-badge"
      type="button"
      :style="labelStyle"
      :title="sourceLabel.hint"
      @click="openActiveSelectionInEditor()"
    >
      <strong>{{ sourceLabel.label }}</strong>
      <span>{{ sourceLabel.hint }}</span>
    </button>

    <div class="bottom-dock">
      <button
        ref="panelButton"
        class="dock-button dock-inspect-button"
        type="button"
        :aria-pressed="isInspecting"
        title="Inspect component (Alt+Shift+I)"
        @click="isInspecting ? stopInspecting() : startInspecting()"
      >
        Inspect
      </button>
      <span class="dock-divider" />
      <button
        class="dock-button dock-panel-button"
        type="button"
        title="Toggle panel (Alt+Shift+P)"
        :aria-expanded="isOpen"
        @click="togglePanel"
      >
        Panel
      </button>
    </div>

    <aside v-if="isOpen" class="panel-shell" aria-labelledby="inspect-devtools-title">
      <header class="panel-header">
        <h1 id="inspect-devtools-title" ref="panelHeading" class="title" tabindex="-1">Inspect Devtools</h1>
        <button class="icon-button" type="button" aria-label="Close panel" title="Close panel" @click="togglePanel">×</button>
      </header>

      <div class="toolbar">
        <button
          class="primary-button"
          type="button"
          :disabled="isOpening"
          :aria-pressed="isInspecting"
          @click="isInspecting ? stopInspecting() : startInspecting()"
        >
          {{ isInspecting ? 'Stop' : 'Inspect' }}
        </button>
        <span class="status-pill">{{ isInspecting ? 'Inspecting' : selection ? 'Selected' : 'Ready' }}</span>
      </div>
      <p v-if="feedback" class="panel-feedback" aria-live="polite">{{ feedback }}</p>
      <p v-if="lastError" class="panel-error" role="alert">{{ lastError }}</p>

      <main class="panel-main panel-main-inspect">
        <SelectionPanel
          :is-opening="isOpening"
          :selection="selection"
          @copy-location="copySelectionLocation"
          @open-in-editor="openSelectionInEditor"
        />
      </main>
    </aside>
  </div>
</template>
