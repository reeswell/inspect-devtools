<script setup lang="ts">
import type { ClientInspectDevtoolsOptions, InspectDevtoolsTheme } from '@inspect-devtools/core'
import { shallowRef } from 'vue'
import { loadPersistedTheme, persistTheme } from './composables/theme'
import { useInspector } from './composables/useInspector'

const props = defineProps<{
  options: ClientInspectDevtoolsOptions
}>()

const theme = shallowRef<InspectDevtoolsTheme>(loadPersistedTheme(props.options.projectRoot) ?? props.options.theme)
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  persistTheme(props.options.projectRoot, theme.value)
}

const inspector = useInspector(props.options)
const {
  isInspecting,
  isMarqueeing,
  feedback,
  hoverOverlayStyle,
  labelStyle,
  lastError,
  marqueeStyle,
  modifierAction,
  openActiveSelectionInEditor,
  overlayStyles,
  selections,
  sourceLabel,
  startInspecting,
  stopInspecting,
} = inspector

</script>

<template>
  <div class="inspect-devtools-root" data-inspect-devtools="true" :data-theme="theme">
    <div v-for="(style, index) in overlayStyles" :key="index" class="inspector-frame" :style="style" />
    <div
      class="inspector-frame inspector-frame--hover"
      :class="{
        'inspector-frame--add': modifierAction === 'add',
        'inspector-frame--remove': modifierAction === 'subtract',
      }"
      :style="hoverOverlayStyle"
    />
    <div class="marquee-rect" :class="{ 'marquee-rect--remove': isMarqueeing && modifierAction === 'subtract' }" :style="marqueeStyle" />

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

    <div class="toast-stack" aria-live="polite">
      <p v-if="lastError" class="toast toast-error" role="alert">{{ lastError }}</p>
      <p v-else-if="feedback" class="toast">{{ feedback }}</p>
    </div>

    <div class="bottom-dock">
      <button
        class="dock-button dock-button--inspect"
        type="button"
        :aria-pressed="isInspecting"
        aria-label="Inspect component (Alt+Shift+I)"
        title="Inspect component (Alt+Shift+I)"
        @click="isInspecting ? stopInspecting() : startInspecting()"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5V6M10 2h2.5A1.5 1.5 0 0 1 14 3.5V6M2 10v2.5A1.5 1.5 0 0 0 3.5 14H6M14 10v2.5a1.5 1.5 0 0 1-1.5 1.5H10" />
          <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <span v-if="selections.length" class="dock-badge" aria-hidden="true">{{ selections.length }}</span>
      </button>
      <button
        class="dock-button dock-button--theme"
        type="button"
        :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        :title="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="toggleTheme"
      >
        <svg v-if="theme === 'dark'" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M13.4 9.6A5.4 5.4 0 0 1 6.4 2.6a5.4 5.4 0 1 0 7 7Z" />
        </svg>
      </button>
    </div>
  </div>
</template>
