<template>
  <main class="frame">
    
    <HeaderNav
      @home="navigateTo('/')"
      @work="navigateTo('/')"
      @services="navigateTo('/services')"
      @about="navigateTo('/about')"
      @contact="navigateTo('/contact')"
    />

    <section class="body">
      <div class="k title" data-reveal>( CONTACT )</div>

      <div class="card" data-reveal>
        <div class="k">EMAIL</div>
        <a class="k dim2 link" :href="`mailto:${site.contact.email}`">{{ site.contact.email }}</a>

        <div class="sep" />

        <div class="k">SOCIALS</div>
        <div class="links">
          <a class="k dim2 link" :href="site.hero.links.youtube" target="_blank" rel="noreferrer">( YOUTUBE )</a>
          <a class="k dim2 link" :href="site.hero.links.instagram" target="_blank" rel="noreferrer">( INSTAGRAM )</a>
          <a
            v-for="([key, href]) in otherLinks"
            :key="key"
            class="k dim2 link"
            :href="href"
            target="_blank"
            rel="noreferrer"
          >( {{ key.toUpperCase() }} )</a>
        </div>

        <div class="sep" />

        <div class="k dim2">{{ site.description }}</div>
      </div>
    </section>

    <FooterNav
      :current="0"
      :total="total"
      :year="String(new Date().getFullYear())"
      :showBack="true"
      @back="navigateTo('/')"
      @listing="navigateTo('/')"
      @jump="() => {}"
    />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { site } from '~/content/site'
import { projects } from '~/composables/useProjects'

const total = computed(() => projects.length)

// Avoid duplicate Instagram link (already shown above from hero.links)
const otherLinks = computed(() => {
  return Object.entries(site.contact.links).filter(([key]) => key.toLowerCase() !== 'instagram')
})
</script>

<style scoped>
.body{ flex:1; padding-top: 6vh; padding-bottom: 6vh; }
.title{ margin-bottom: 18px; }
.card{
  border: 1px solid var(--line);
  padding: 18px;
  width: min(760px, 92vw);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.links{ display:flex; flex-wrap:wrap; gap: 14px; margin-top: 10px; }
.link{ transition: opacity .18s ease; }
.link:hover{ opacity: 1; }
.sep{ height: 14px; }
@media (prefers-reduced-motion: reduce){
  .link{ transition:none; }
}
</style>
