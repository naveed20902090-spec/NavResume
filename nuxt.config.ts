import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      title: "Tauseef Rahman (NAV) — Portfolio",
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: "Story-first video editor for cinematic montages, architectural/brand showcases, vlogs, podcasts & retention-first short-form." },
      ],
      link: [
        // Replace with the exact font once known; this is a close visual surrogate.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&display=swap' },
      ],
    }
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true }
})
