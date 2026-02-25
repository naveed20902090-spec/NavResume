<template>
  <header class="hdr" data-reveal>
    <!-- TOP (scroll at top): centered vertical list like Figma -->
    <nav
      class="topNav"
      aria-label="Primary"
      :style="topStyle"
    >
      <a
        v-for="it in itemsTop"
        :key="it.key"
        class="k link topItem"
        :class="{ dim2: !isActive(it.key), hot: isActive(it.key) }"
        href="#"
        @click.prevent="emitNav(it.key)"
      >
        <span v-if="isActive(it.key)">(</span>
        {{ it.label }}
        <span v-if="isActive(it.key)">)</span>
      </a>
    </nav>

    <!-- SCROLLED: horizontal row with parentheses around each item (like Figma) -->
    <nav
      class="rowNav"
      aria-label="Primary"
      :style="rowStyle"
    >
      <a
        v-for="it in itemsRow"
        :key="it.key"
        class="k link rowItem"
        :class="{ dim2: !isHot(it.key), hot: isHot(it.key) }"
        href="#"
        @mouseenter="hoverKey = it.key"
        @mouseleave="hoverKey = null"
        @click.prevent="emitNav(it.key)"
      >{{ it.label }}</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { site } from '~/content/site'

const emit = defineEmits<{ (e:'home'):void; (e:'work'):void; (e:'services'):void; (e:'about'):void; (e:'contact'):void }>()
const route = useRoute()

const itemsTop = [
  { key: 'home', label: 'HOME' },
  { key: 'work', label: 'WORK' },
  { key: 'services', label: 'SERVICES' },
  { key: 'about', label: 'ABOUT' }
] as const

const itemsRow = [
  { key: 'home', label: 'HOME' },
  { key: 'work', label: 'WORK' },
  { key: 'services', label: 'SERVICES' },
  { key: 'about', label: 'ABOUT' },
  { key: 'contact', label: 'CONTACT' }
] as const

type Key = typeof itemsRow[number]['key']

const hoverKey = ref<Key | null>(null)

const activeKey = computed<Key>(() => {
  const p = route.path
  if (p.startsWith('/services')) return 'services'
  if (p.startsWith('/about')) return 'about'
  if (p.startsWith('/contact')) return 'contact'
  if (p.startsWith('/work') || p.startsWith('/project')) return 'work'
  return 'home'
})

function isActive(key: Key){
  return activeKey.value === key
}

function isHot(key: Key){
  return (hoverKey.value ?? activeKey.value) === key
}

const progress = ref(0) // 0 => top mode, 1 => row mode

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const TOP_RANGE = 90 // px: scroll distance over which the nav morphs

let raf = 0
function updateProgress(){
  if (!process.client) return

  // Only apply this behavior on the homepage (Figma spec)
  if (route.path !== '/') {
    progress.value = 1
    return
  }

  const y = window.scrollY || 0
  const t = Math.min(1, Math.max(0, y / TOP_RANGE))
  progress.value = t
}

function onScroll(){
  if (!process.client) return
  if (raf) return
  raf = window.requestAnimationFrame(() => {
    raf = 0
    updateProgress()
  })
}

function emitNav(key: Key){
  if (key === 'home') emit('home')
  if (key === 'work') emit('work')
  if (key === 'services') emit('services')
  if (key === 'about') emit('about')
  if (key === 'contact') emit('contact')
}

const topStyle = computed(() => {
  const t = reduce() ? (progress.value > 0.01 ? 0 : 1) : (1 - progress.value)
  const y = reduce() ? 0 : (progress.value * -10)
  const blur = reduce() ? 0 : (progress.value * 3)

  return {
    opacity: String(t),
    transform: `translate3d(0, ${y}px, 0)`,
    filter: blur ? `blur(${blur}px)` : 'none',
    pointerEvents: t > 0.35 ? 'auto' : 'none'
  } as Record<string, string>
})

const rowStyle = computed(() => {
  const t = reduce() ? (progress.value > 0.01 ? 1 : 0) : progress.value
  const y = reduce() ? 0 : ((1 - progress.value) * 10)
  const blur = reduce() ? 0 : ((1 - progress.value) * 3)

  return {
    opacity: String(t),
    transform: `translate3d(0, ${y}px, 0)`,
    filter: blur ? `blur(${blur}px)` : 'none',
    pointerEvents: t > 0.35 ? 'auto' : 'none'
  } as Record<string, string>
})

onMounted(() => {
  if (!process.client) return
  updateProgress()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('scroll', onScroll as any)
  if (raf) window.cancelAnimationFrame(raf)
})

watch(() => route.path, () => {
  if (!process.client) return
  nextTick(() => updateProgress())
})
</script>

<style scoped>
.hdr{
  position:relative;
  padding-top: 8px;
  z-index:5;
  min-height: 78px;
}

/* Gradual morph: JS drives opacity/transform/filter via inline styles.
   Keep will-change hints so it feels smooth. */
.topNav,
.rowNav{
  will-change: transform, opacity, filter;
}

/* TOP MODE (Pic 4) */
.topNav{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap: 6px;
  padding-top: 18px;
}
.topItem{
  font-size: calc(var(--fs) * 1.35);
  font-weight: 500;
  letter-spacing: var(--ls);
  opacity: .72;
  box-shadow: none;
}
.topItem.hot{ opacity: 1; }
.topItem:hover,
.topItem:focus,
.topItem:focus-visible{ box-shadow:none !important; }

/* ROW MODE (Pic 3) */
.rowNav{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 32px;
  padding-top: 14px;
  flex-wrap:wrap;
}
.rowItem{
  font-size: calc(var(--fs) * 1.18);
  font-weight: 500;
  letter-spacing: var(--ls);
  opacity: .72;
  box-shadow: none;
  position:relative;
}
/* Always show parentheses around items */
.rowItem::before{ content:"( "; opacity: .9; }
.rowItem::after{ content:" )"; opacity: .9; }

.rowItem.hot{ opacity: 1; }
.rowItem:hover,
.rowItem:focus,
.rowItem:focus-visible{ box-shadow:none !important; }

@media (prefers-reduced-motion: reduce){
  .topNav, .rowNav{ filter:none; }
}

@media (max-width: 768px){
  .hdr{ min-height: 64px; }
  .rowNav{ gap: 18px; }
}
</style>
