<template>
  <header class="hdr" data-reveal :data-mode="mode">
    <!-- TOP (scroll at top): centered vertical list like Figma -->
    <nav class="topNav" aria-label="Primary" v-show="mode === 'top'">
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
    <nav class="rowNav" aria-label="Primary" v-show="mode === 'row'">
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

const mode = ref<'top'|'row'>('top')

function reduce(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function updateMode(){
  if (!process.client) return
  // Only apply this behavior on the homepage (Figma spec)
  if (route.path !== '/') {
    mode.value = 'row'
    return
  }
  const y = window.scrollY || 0
  mode.value = y <= 40 ? 'top' : 'row'
}

function emitNav(key: Key){
  if (key === 'home') emit('home')
  if (key === 'work') emit('work')
  if (key === 'services') emit('services')
  if (key === 'about') emit('about')
  if (key === 'contact') emit('contact')
}

onMounted(() => {
  if (!process.client) return
  updateMode()
  window.addEventListener('scroll', updateMode, { passive: true })
})

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('scroll', updateMode as any)
})

watch(() => route.path, () => {
  if (!process.client) return
  nextTick(() => updateMode())
})
</script>

<style scoped>
.hdr{
  position:relative;
  padding-top: 8px;
  z-index:5;
  min-height: 78px;
}

/* Smooth crossfade between modes */
.topNav,
.rowNav{
  transition: opacity .22s ease, transform .22s ease;
}

.hdr[data-mode="top"] .topNav{ opacity: 1; transform: translateY(0); }
.hdr[data-mode="top"] .rowNav{ opacity: 0; transform: translateY(-6px); pointer-events:none; }

.hdr[data-mode="row"] .rowNav{ opacity: 1; transform: translateY(0); }
.hdr[data-mode="row"] .topNav{ opacity: 0; transform: translateY(6px); pointer-events:none; }

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
  .topNav, .rowNav{ transition:none; }
}

@media (max-width: 768px){
  .hdr{ min-height: 64px; }
  .rowNav{ gap: 18px; }
}
</style>
