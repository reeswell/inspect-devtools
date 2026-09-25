<script setup lang="ts">
import type { ClientInspectDevtoolsOptions, InspectDevtoolsTheme } from '@inspect-devtools/core'
import { ref, shallowRef } from 'vue'
import { loadPersistedTheme, persistTheme } from './composables/theme'
import { useInspector } from './composables/useInspector'
import { useDock } from './composables/dock'

const props = defineProps<{
  options: ClientInspectDevtoolsOptions
}>()

const theme = shallowRef<InspectDevtoolsTheme>(loadPersistedTheme(props.options.projectRoot) ?? props.options.theme)
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  persistTheme(props.options.projectRoot, theme.value)
}

const dockRef = ref<HTMLElement | null>(null)
const dock = useDock(props.options.projectRoot)
const {
  consumeClick,
  dockStyle,
  isCollapsed,
  isDragging,
  onPointerDown: onDockPointerDown,
  onPointerMove: onDockPointerMove,
  onPointerUp: onDockPointerUp,
  toggleCollapsed,
} = dock

const handleWindowPointerMove = (event: PointerEvent) => {
  onDockPointerMove(event)
}

const handleWindowPointerUp = () => {
  onDockPointerUp()
  window.removeEventListener('pointermove', handleWindowPointerMove)
  window.removeEventListener('pointerup', handleWindowPointerUp)
}

const handleDockPointerDown = (event: PointerEvent) => {
  onDockPointerDown(event, dockRef.value)
  window.addEventListener('pointermove', handleWindowPointerMove)
  window.addEventListener('pointerup', handleWindowPointerUp)
}

const handleInspectClick = () => {
  if (consumeClick())
    return
  if (isCollapsed.value) {
    toggleCollapsed()
    return
  }
  isInspecting.value ? stopInspecting() : startInspecting()
}

const handleThemeClick = () => {
  if (consumeClick())
    return
  toggleTheme()
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
  selectHierarchyIndex,
  selections,
  selectionCount,
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

    <div
      v-if="sourceLabel"
      v-show="sourceLabel.canOpen"
      class="source-badge-container"
      :style="labelStyle"
    >
      <nav
        v-if="!isInspecting && sourceLabel.hierarchy && sourceLabel.hierarchy.length > 1"
        class="hierarchy-breadcrumb"
        aria-label="Component Hierarchy"
      >
        <button
          v-for="(item, idx) in sourceLabel.hierarchy"
          :key="idx"
          type="button"
          class="breadcrumb-item"
          :class="{ 'breadcrumb-item--active': idx === sourceLabel.activeHierarchyIndex }"
          :title="item.filePath ? `${item.componentName} (${item.filePath}${item.line ? `:${item.line}` : ''})` : item.componentName"
          @click.stop="selectHierarchyIndex(idx)"
        >
          <span class="breadcrumb-item__name">{{ item.componentName }}</span>
          <span v-if="idx < sourceLabel.hierarchy.length - 1" class="breadcrumb-item__sep" aria-hidden="true">›</span>
        </button>
      </nav>

      <button
        class="source-badge"
        type="button"
        :title="sourceLabel.hint"
        @click="openActiveSelectionInEditor()"
      >
        <strong>{{ sourceLabel.label }}</strong>
        <span>{{ sourceLabel.hint }}</span>
      </button>
    </div>

    <div class="toast-stack" aria-live="polite">
      <p v-if="lastError" class="toast toast-error" role="alert">{{ lastError }}</p>
      <p v-else-if="feedback" class="toast">{{ feedback }}</p>
    </div>

    <div
      ref="dockRef"
      class="bottom-dock"
      :class="{
        'bottom-dock--collapsed': isCollapsed,
        'bottom-dock--dragging': isDragging,
      }"
      :style="dockStyle"
      @pointerdown="handleDockPointerDown"
      @dblclick="toggleCollapsed"
    >
      <template v-if="!isCollapsed">
        <button
          class="dock-button dock-button--inspect"
          type="button"
          :aria-pressed="isInspecting"
          aria-label="Inspect component (Alt+Shift+I)"
          title="Inspect component (Alt+Shift+I) · Double-click to collapse"
          @click="handleInspectClick"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5V6M10 2h2.5A1.5 1.5 0 0 1 14 3.5V6M2 10v2.5A1.5 1.5 0 0 0 3.5 14H6M14 10v2.5a1.5 1.5 0 0 1-1.5 1.5H10" />
            <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <span v-if="selectionCount" class="dock-badge" aria-hidden="true">{{ selectionCount }}</span>
        </button>
        <button
          class="dock-button dock-button--theme"
          type="button"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          :title="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="handleThemeClick"
        >
          <svg v-if="theme === 'dark'" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M13.4 9.6A5.4 5.4 0 0 1 6.4 2.6a5.4 5.4 0 1 0 7 7Z" />
          </svg>
        </button>
      </template>
      <template v-else>
        <button
          class="dock-button dock-button--mini"
          type="button"
          aria-label="Expand inspect devtools"
          title="Expand inspect devtools (Double-click or click to expand)"
          @click="toggleCollapsed"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="8" cy="8" r="3" fill="var(--inspect-brand)" stroke="none" />
          </svg>
          <span v-if="selections.length" class="dock-badge dock-badge--mini" aria-hidden="true">{{ selections.length }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
