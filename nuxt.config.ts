import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      title: "Tauseef Rahman (NAV) — Portfolio",
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: "Story-first video editor for cinematic montages, architectural/brand showcases, vlogs, podcasts & retention-first short-form." },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: "Tauseef Rahman (NAV) — Cinematic Video Editor" },
        { property: 'og:description', content: "Cinematic, retention-first video editing: gaming montages, architectural showcases, long-form and short-form." },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://navresume.vercel.app' },
        // NOTE: OpenGraph image should be an absolute URL for best compatibility.
        { property: 'og:image', content: 'https://navresume.vercel.app/og.svg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://navresume.vercel.app/og.svg' },
      ],
      link: [
        // Replace with the exact font once known; this is a close visual surrogate.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preload', as: 'image', href: 'https://i.ytimg.com/vi/6k_Esgfw57k/hqdefault.jpg', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&display=swap' },
      ],
    }
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true }
})
