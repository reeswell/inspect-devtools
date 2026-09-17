<script setup lang="ts">
import type { ClientInspectDevtoolsOptions, CopyFormat, InspectDevtoolsTheme } from '@inspect-devtools/core'
import { nextTick, shallowRef, useTemplateRef } from 'vue'
import { loadPersistedTheme, persistTheme } from './composables/theme'
import { useInspector } from './composables/useInspector'

const props = defineProps<{
  options: ClientInspectDevtoolsOptions
}>()

const COPY_FORMAT_OPTIONS: { value: CopyFormat, label: string }[] = [
  { value: 'codex', label: 'Codex' },
  { value: 'cursor', label: 'Cursor / Claude Code' },
]

const isOpen = shallowRef(false)
const panelButton = useTemplateRef<HTMLButtonElement>('panelButton')
const panelHeading = useTemplateRef<HTMLHeadingElement>('panelHeading')
const togglePanel = async () => {
  isOpen.value = !isOpen.value
  await nextTick()
  if (isOpen.value) panelHeading.value?.focus()
  else panelButton.value?.focus()
}

const theme = shallowRef<InspectDevtoolsTheme>(loadPersistedTheme(props.options.projectRoot) ?? props.options.theme)
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  persistTheme(props.options.projectRoot, theme.value)
}

const inspector = useInspector(props.options, { onTogglePanel: togglePanel })
const {
  isInspecting,
  copyFormat,
  defaultCopyFormat,
  feedback,
  isCopyFormatOverridden,
  isOpening,
  labelStyle,
  lastError,
  openActiveSelectionInEditor,
  overlayStyle,
  resetCopyFormat,
  selection,
  setCopyFormat,
  sourceLabel,
  startInspecting,
  stopInspecting,
} = inspector

const copyFormatLabel = (value: CopyFormat) => COPY_FORMAT_OPTIONS.find(option => option.value === value)?.label ?? value

</script>

<template>
  <div class="inspect-devtools-root" data-inspect-devtools="true" :data-theme="theme">
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
        class="dock-button"
        type="button"
        :aria-pressed="isInspecting"
        aria-label="Inspect component (Alt+Shift+I)"
        title="Inspect component (Alt+Shift+I)"
        @click="isInspecting ? stopInspecting() : startInspecting()"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="3.4" />
          <path d="M8 1.6v2.2M8 12.2v2.2M1.6 8h2.2M12.2 8h2.2" />
        </svg>
      </button>
      <button
        class="dock-button"
        type="button"
        aria-label="Toggle panel (Alt+Shift+P)"
        title="Toggle panel (Alt+Shift+P)"
        :aria-expanded="isOpen"
        @click="togglePanel"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="2" />
          <path d="M10 2.8v10.4" />
        </svg>
      </button>
    </div>

    <aside v-if="isOpen" class="panel-shell" aria-labelledby="inspect-devtools-title">
      <header class="panel-header">
        <h1 id="inspect-devtools-title" ref="panelHeading" class="title" tabindex="-1">Inspect Devtools</h1>
        <div class="header-actions">
          <button
            class="icon-button"
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
          <button class="icon-button" type="button" aria-label="Close panel" title="Close panel" @click="togglePanel">×</button>
        </div>
      </header>

      <div class="toolbar">
        <button
          class="toolbar-button"
          type="button"
          :disabled="isOpening"
          :aria-pressed="isInspecting"
          :aria-label="isInspecting ? 'Stop inspecting (Alt+Shift+I)' : 'Inspect component (Alt+Shift+I)'"
          :title="isInspecting ? 'Stop inspecting (Alt+Shift+I)' : 'Inspect component (Alt+Shift+I)'"
          @click="isInspecting ? stopInspecting() : startInspecting()"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
            <circle cx="8" cy="8" r="3.4" />
            <path d="M8 1.6v2.2M8 12.2v2.2M1.6 8h2.2M12.2 8h2.2" />
          </svg>
        </button>
        <span class="status-pill">{{ isInspecting ? 'Inspecting' : selection ? 'Selected' : 'Ready' }}</span>
      </div>
      <p v-if="feedback" class="panel-feedback" aria-live="polite">{{ feedback }}</p>
      <p v-if="lastError" class="panel-error" role="alert">{{ lastError }}</p>

      <main class="panel-main panel-main-inspect">
        <section class="surface copy-format-panel">
          <div class="section-heading">
            <h2>Copy format</h2>
            <button
              v-if="isCopyFormatOverridden"
              class="ghost-button"
              type="button"
              :aria-label="`Reset to project default (${copyFormatLabel(defaultCopyFormat)})`"
              :title="`Reset to project default (${copyFormatLabel(defaultCopyFormat)})`"
              @click="resetCopyFormat"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2.8 6.7A5.4 5.4 0 1 1 2.6 10" />
                <path d="M2.5 3.6v3.2h3.2" />
              </svg>
            </button>
          </div>
          <div class="segmented" role="radiogroup" aria-label="Copy format">
            <label
              v-for="option in COPY_FORMAT_OPTIONS"
              :key="option.value"
              class="segment"
              :data-active="copyFormat === option.value"
            >
              <input
                class="segment-input"
                type="radio"
                name="inspect-devtools-copy-format"
                :value="option.value"
                :checked="copyFormat === option.value"
                @change="setCopyFormat(option.value)"
              >
              <span>{{ option.label }}</span>
            </label>
          </div>
          <p class="copy-format-hint">This browser only · Project default: {{ copyFormatLabel(defaultCopyFormat) }}</p>
        </section>
      </main>
    </aside>
  </div>
</template>
