// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@inspect-devtools/nuxt'],
  devtools: { enabled: false },
  css: ['~/assets/style.css'],
  inspectDevtools: {
    openOnClick: true,
  },
})
