<template>
  <main class="frame">
    <HeaderNav
      @home="navigateTo('/')"
      @work="navigateTo('/work')"
      @services="navigateTo('/services')"
      @about="navigateTo('/about')"
      @contact="navigateTo('/contact')"
    />

    <section class="body">
      <!-- Header -->
      <div class="head" data-reveal>
        <div class="k dim2 kicker">{{ site.contact.kicker }}</div>
        <h1 class="k title h1">{{ site.contact.headline }}</h1>
        <p class="k dim lead">{{ site.contact.cta }}</p>
      </div>

      <div class="luxDivider" data-line />

      <!-- Two column -->
      <div class="cols">
        <!-- Form -->
        <div data-reveal>
          <div class="k title h2">Send a message</div>

          <form class="form" @submit.prevent="submit">
            <div class="field">
              <label class="k dim2 lbl" for="name">Your name</label>
              <input id="name" v-model.trim="form.name" class="k input" type="text" required />
            </div>

            <div class="field">
              <label class="k dim2 lbl" for="email">Your email</label>
              <input id="email" v-model.trim="form.email" class="k input" type="email" required />
            </div>

            <div class="field">
              <label class="k dim2 lbl" for="project">Project type</label>
              <select id="project" v-model="form.project" class="k input" required>
                <option value="">Select a service</option>
                <option>Gaming Montage</option>
                <option>Architectural Showcase</option>
                <option>Vlog/Podcast</option>
                <option>Short-form Content</option>
                <option>Brand Showcase</option>
                <option>Other</option>
              </select>
            </div>

            <div class="field">
              <label class="k dim2 lbl" for="message">Project details</label>
              <textarea
                id="message"
                v-model.trim="form.message"
                class="k input"
                rows="6"
                required
                placeholder="Tell me about your project, timeline, and any references..."
              />
            </div>

            <button class="k ctaBtn btn" type="submit">Send message</button>
          </form>
        </div>

        <!-- Info -->
        <div class="info">
          <div data-reveal>
            <div class="k title h3">Direct contact</div>
            <div class="stack">
              <a class="k dim link" :href="`mailto:${site.contact.email}`">{{ site.contact.email }}</a>
              <div class="k dim"><span class="k dim2">📍</span> {{ site.location }}</div>
            </div>
          </div>

          <div data-reveal>
            <div class="k title h3">Find me online</div>
            <div class="stack">
              <a class="k dim link" :href="site.contact.links.youtube" target="_blank" rel="noreferrer">YouTube (@PapaNavv)</a>
              <a class="k dim link" :href="site.contact.links.instagram" target="_blank" rel="noreferrer">Instagram (@na._.vvv)</a>
              <a class="k dim link" :href="site.contact.links.upwork" target="_blank" rel="noreferrer">Upwork profile</a>
              <a class="k dim link" :href="site.contact.links.x" target="_blank" rel="noreferrer">X (Twitter)</a>
              <a class="k dim link" :href="site.contact.links.facebook" target="_blank" rel="noreferrer">Facebook</a>
            </div>
          </div>

          <div class="plaque" data-reveal>
            <div class="k dim2" style="font-size: 12px;">Availability</div>
            <p class="k" style="font-size: 14px; line-height: 1.7; text-transform:none; letter-spacing:0.01em; margin-top: 10px;">
              {{ site.contact.availability }}
            </p>
          </div>
        </div>
      </div>

      <div class="luxDivider" data-line style="margin-top: 46px;" />

      <!-- What to include -->
      <div class="plaque luxSpot include" data-reveal @mousemove="onSpot" @mouseleave="offSpot">
        <div class="k title h3">What to include in your message</div>

        <div class="includeGrid">
          <ul class="ul">
            <li class="k dim li"><span class="k dim2">→</span> Link to raw footage or references</li>
            <li class="k dim li"><span class="k dim2">→</span> Project type and desired length</li>
            <li class="k dim li"><span class="k dim2">→</span> Deadline and turnaround expectations</li>
          </ul>
          <ul class="ul">
            <li class="k dim li"><span class="k dim2">→</span> Creative direction or mood references</li>
            <li class="k dim li"><span class="k dim2">→</span> Budget or project scope</li>
            <li class="k dim li"><span class="k dim2">→</span> Platform (YouTube, IG, TikTok, etc.)</li>
          </ul>
        </div>
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
import { computed, reactive } from 'vue'
import { site } from '~/content/site'
import { projects } from '~/composables/useProjects'

const total = computed(() => projects.length)

const form = reactive({
  name: '',
  email: '',
  project: '',
  message: ''
})

function submit(){
  const subject = encodeURIComponent(`Project Inquiry: ${form.project}`)
  const body = encodeURIComponent(
    `Name: ${form.name}\nEmail: ${form.email}\n\nProject Type: ${form.project}\n\nMessage:\n${form.message}`
  )
  if (process.client) {
    window.location.href = `mailto:${site.contact.email}?subject=${subject}&body=${body}`
  }
}

function onSpot(e: MouseEvent){
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  el.style.setProperty('--mx', `${x}%`)
  el.style.setProperty('--my', `${y}%`)
}

function offSpot(e: MouseEvent){
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  el.style.setProperty('--mx', '50%')
  el.style.setProperty('--my', '50%')
}
</script>

<style scoped>
.body{ flex:1; padding-top: 6vh; padding-bottom: 6vh; }

.head{ margin-bottom: 18px; }
.kicker{ font-size: 13px; margin-bottom: 14px; }
.h1{ font-size: clamp(28px, 5vw, 42px); line-height: 1.2; margin: 0 0 12px; }
.lead{ max-width: 720px; line-height: 1.8; font-size: 16px; margin: 0; text-transform:none; letter-spacing: 0.01em; }

.cols{ margin-top: 26px; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px; }
.h2{ font-size: 20px; margin-bottom: 14px; }
.h3{ font-size: 18px; margin-bottom: 12px; }

.form{ display:flex; flex-direction:column; gap: 16px; }
.field{ display:flex; flex-direction:column; gap: 8px; }
.lbl{ font-size: 12px; }
.input{
  width:100%;
  padding: 14px 18px;
  background: transparent;
  border: 1px solid var(--strokeLo);
  font-size: 14px;
  color: var(--fg);
  outline: none;
  text-transform: none;
  letter-spacing: 0.01em;
}
.btn{ width: 100%; padding: 16px 32px; border: 1px solid var(--strokeHi); display:flex; justify-content:center; align-items:center; }

.info{ display:flex; flex-direction:column; gap: 28px; }
.stack{ margin-top: 10px; display:flex; flex-direction:column; gap: 12px; }
.link{ font-size: 14px; }

.plaque{ border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); }

.include{ margin-top: 22px; border: 1px solid var(--strokeLo); padding: 18px; background: color-mix(in srgb, var(--bg) 74%, transparent); }
.includeGrid{ margin-top: 14px; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 22px; }
.ul{ margin: 0; padding-left: 0; list-style:none; display:flex; flex-direction:column; gap: 10px; }
.li{ font-size: 13px; display:flex; gap: 10px; align-items:flex-start; }

@media (max-width: 1024px){
  .cols{ grid-template-columns: 1fr; }
  .includeGrid{ grid-template-columns: 1fr; }
}
</style>
