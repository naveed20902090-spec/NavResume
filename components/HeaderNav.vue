<template>
  <header class="hdr" data-reveal>
    <div class="k left">
      {{ site.displayName.toUpperCase() }}
      <span class="k dim2 handle">{{ site.handle.toUpperCase() }}</span>
    </div>

    <nav class="mid" aria-label="Primary">
      <div ref="stack" class="stack" @mouseleave="onLeave">
        <span ref="bL" class="k dim2 bracket leftB">(</span>
        <span ref="bR" class="k dim2 bracket rightB">)</span>

        <a
          v-for="it in items"
          :key="it.key"
          :ref="(el) => setItemRef(el as HTMLElement | null, it.key)"
          class="k link navItem"
          :class="{
            dim2: !isHot(it.key),
            hot: isHot(it.key),
            hovered: hoverKey === it.key
          }"
          href="#"
          @mouseenter="onEnter(it.key)"
          @click.prevent="emitNav(it.key)"
        >{{ it.label }}</a>
      </div>
    </nav>

    <div class="k right">
      <a class="link contact" href="#" @mouseenter="contactHover = true" @mouseleave="contactHover = false" @click.prevent="$emit('contact')"
        :class="{ dim2: !contactHover, hot: contactHover }"
      >( CONTACT )</a>
    </div>
  </header>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { site } from '~/content/site'

const emit = defineEmits<{ (e:'home'):void; (e:'work'):void; (e:'services'):void; (e:'about'):void; (e:'contact'):void }>()
const route = useRoute()

const items = [
  { key: 'home', label: 'HOME' },
  { key: 'work', label: 'WORK' },
  { key: 'services', label: 'SERVICES' },
  { key: 'about', label: 'ABOUT' }
] as const

type Key = typeof items[number]['key']

const hoverKey = ref<Key | null>(null)
const contactHover = ref(false)

const activeKey = computed<Key>(() => {
  const p = route.path
  if (p.startsWith('/services')) return 'services'
  if (p.startsWith('/about')) return 'about'
  if (p.startsWith('/contact')) return 'home'
  if (p.startsWith('/work') || p.startsWith('/project')) return 'work'
  return 'home'
})

const stack = ref<HTMLElement | null>(null)
const bL = ref<HTMLElement | null>(null)
const bR = ref<HTMLElement | null>(null)

// quickTo setters (tighter, premium nav feel)
let qxL: ((v:number)=>void) | null = null
let qyL: ((v:number)=>void) | null = null
let qsL: ((v:number)=>void) | null = null
let qxR: ((v:number)=>void) | null = null
let qyR: ((v:number)=>void) | null = null
let qsR: ((v:number)=>void) | null = null

const refs = new Map<Key, HTMLElement>()

function setItemRef(el: HTMLElement | null, key: Key){
  if (!el) return
  refs.set(key, el)
}

function reduced(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isHot(key: Key){
  return (hoverKey.value ?? activeKey.value) === key
}

function moveBracketTo(key: Key, scale = 1){
  if (!process.client || !stack.value || !bL.value || !bR.value) return
  const el = refs.get(key)
  if (!el) return

  const stackRect = stack.value.getBoundingClientRect()
  const itemRect = el.getBoundingClientRect()

  // Position brackets relative to the hovered item's box (pixel-accurate alignment)
  const xPad = 10
  const y = itemRect.top - stackRect.top
  const leftX = (itemRect.left - stackRect.left) - xPad
  const rightX = (itemRect.right - stackRect.left) + xPad

  // Anchor left bracket from its left edge; right bracket from its right edge.
  gsap.set(bL.value, { xPercent: 0, display: 'block' })
  gsap.set(bR.value, { xPercent: -100, display: 'block' })

  // Use quickTo for tighter, premium response (less "tween pile-up").
  qxL?.(leftX); qyL?.(y); qsL?.(scale)
  qxR?.(rightX); qyR?.(y); qsR?.(scale)
}


function onEnter(key: Key){
  hoverKey.value = key
  if (!reduced()) moveBracketTo(key, 1.25)
  else moveBracketTo(key, 1)
}

function onLeave(){
  hoverKey.value = null
  // snap back to active route
  moveBracketTo(activeKey.value, 1)
}

function emitNav(key: Key){
  if (key === 'home') emit('home')
  if (key === 'work') emit('work')
  if (key === 'services') emit('services')
  if (key === 'about') emit('about')
}

onMounted(() => {
  if (!process.client || !bL.value || !bR.value) return

  // Build quickTo setters once.
  const cfg = { duration: 0.28, ease: 'power3.out', overwrite: 'auto' as const }
  qxL = gsap.quickTo(bL.value, 'x', cfg)
  qyL = gsap.quickTo(bL.value, 'y', cfg)
  qsL = gsap.quickTo(bL.value, 'scale', { duration: 0.22, ease: 'power3.out', overwrite: 'auto' })

  qxR = gsap.quickTo(bR.value, 'x', cfg)
  qyR = gsap.quickTo(bR.value, 'y', cfg)
  qsR = gsap.quickTo(bR.value, 'scale', { duration: 0.22, ease: 'power3.out', overwrite: 'auto' })

  nextTick(() => moveBracketTo(activeKey.value, 1))
})

watch(activeKey, (k) => {
  if (hoverKey.value) return
  nextTick(() => moveBracketTo(k, 1))
})
</script>

<style scoped>
.hdr{
  position:relative;
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:start;
  padding-top: 8px;
  z-index:5;
}
.left{ justify-self:start; padding-left: 2px; display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; }
.handle{ font-size: calc(var(--fs) * 0.92); }
.right{ justify-self:end; padding-right: 2px; }

.mid{
  justify-self:center;
  display:flex;
  align-items:flex-start;
}
.stack{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap: 2px;
  padding: 0 18px;
}
.bracket{
  position:absolute;
  top:0;
  left:0;
  transform: translate3d(0,0,0);
  will-change: transform;
  opacity: .62;
  pointer-events:none;
}
.rightB{ }

.navItem{
  display:inline-block;
  transition: transform .18s ease, opacity .18s ease;
  transform-origin: center;
  font-size: calc(var(--fs) * 1.35);
  font-weight: 500;
  /* Prevent global hover box/glow on nav items */
  box-shadow: none;
}
.navItem:hover,
.navItem:focus,
.navItem:focus-visible{
  box-shadow: none !important;
}
.navItem.hovered{
  transform: scale(1.08);
}
.navItem.hot{
  opacity: 1;
}
.contact{
  transition: opacity .18s ease;
  font-size: calc(var(--fs) * 1.35);
  font-weight: 500;
  box-shadow: none;
}
.contact:hover,
.contact:focus,
.contact:focus-visible{
  box-shadow: none !important;
}

@media (prefers-reduced-motion: reduce){
  .navItem, .contact, .link{ transition:none; }
}

@media (max-width: 768px){
  .hdr{ grid-template-columns: 1fr 1fr; grid-auto-rows:auto; row-gap:6px; }
  .mid{ grid-column: 1 / -1; justify-self:center; }
}
</style>
