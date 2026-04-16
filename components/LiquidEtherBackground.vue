<template>
  <div class="etherShell" :class="`is-${theme}`" aria-hidden="true">
    <video
      ref="videoRef"
      class="etherVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
    >
      <source src="/liquidether.webm" type="video/webm" />
      <source src="/liquidether.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { theme } = useTheme()
const videoRef = ref<HTMLVideoElement | null>(null)

async function ensurePlay(){
  const el = videoRef.value
  if (!el || !process.client) return
  el.muted = true
  el.defaultMuted = true
  el.loop = true
  el.playsInline = true
  el.playbackRate = 1
  try {
    await el.play()
  } catch {}
}

onMounted(() => {
  ensurePlay()
  const el = videoRef.value
  if (!el) return
  el.addEventListener('canplay', ensurePlay, { passive: true })
  el.addEventListener('loadeddata', ensurePlay, { passive: true })
})

watch(theme, () => {
  ensurePlay()
})
</script>

<style scoped>
.etherShell {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background: transparent;
}

.etherVideo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.92;
  transform: scale(1.08);
  filter: saturate(1.06) contrast(1.06);
}

.etherShell.is-light .etherVideo {
  opacity: 0.88;
  filter: invert(1) saturate(0.9) contrast(1.02) brightness(1.04);
}

@media (prefers-reduced-motion: reduce) {
  .etherShell {
    display: none;
  }
}
</style>
