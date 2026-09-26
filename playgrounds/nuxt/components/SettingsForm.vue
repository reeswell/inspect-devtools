<script setup lang="ts">
import { shallowRef } from 'vue'

const notifications = shallowRef(true)
const saved = shallowRef(false)
const save = () => { saved.value = true }
</script>

<template>
  <form class="settings-form" @submit.prevent="save">
    <label><span>Workspace name</span><input value="Source Lab" name="workspace" /></label>
    <label><span>Default branch</span><select name="branch"><option>main</option><option>develop</option></select></label>
    <label class="switch-row"><span>Build notifications</span><input v-model="notifications" type="checkbox" /></label>
    <div class="form-actions"><button type="submit">Save settings</button><span v-if="saved" role="status">Saved</span></div>
  </form>
</template>
