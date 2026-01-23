import { computed, watch } from 'vue'

let bgmEl: HTMLAudioElement | null = null
let started = false

function clamp(v:number, min=0, max=1){ return Math.min(max, Math.max(min, v)) }

function getStoredVolume(){
  if (!process.client) return 0.18
  try{
    const raw = localStorage.getItem('bgmVolume')
    const n = raw ? Number(raw) : NaN
    if (!Number.isFinite(n)) return 0.18
    return clamp(n, 0, 1)
  } catch {
    return 0.18
  }
}

function getAudioEl(volume: number){
  if (!process.client) return null
  if (bgmEl) {
    bgmEl.volume = clamp(volume, 0, 1)
    return bgmEl
  }
  bgmEl = new Audio('/audio/bgm.mp3')
  bgmEl.loop = true
  bgmEl.preload = 'auto'
  bgmEl.volume = clamp(volume, 0, 1)
  return bgmEl
}

/**
 * Single master toggle for both BGM and SFX.
 * Default is true, but audio will only start after the first user gesture.
 */
export function useAudio(){
  const enabled = useState<boolean>('soundEnabled', () => true)
  const volume = useState<number>('bgmVolume', () => getStoredVolume())

  const label = computed(() => enabled.value ? 'MUTE' : 'SOUND')
  const volumePct = computed(() => Math.round(clamp(volume.value, 0, 1) * 100))

  function setEnabled(v: boolean){
    enabled.value = v
  }

  function setVolume(v:number){
    volume.value = clamp(v, 0, 1)
    if (process.client){
      try{ localStorage.setItem('bgmVolume', String(volume.value)) } catch { /* ignore */ }
    }
    const a = getAudioEl(volume.value)
    if (a) a.volume = volume.value
  }

  function toggle(){
    enabled.value = !enabled.value
    // attempt immediate play on toggle (if user gesture already happened)
    if (enabled.value) startIfPossible()
    else stop()
  }

  function startIfPossible(){
    const a = getAudioEl(volume.value)
    if (!a) return
    // Browsers require user gesture; we only try once gesture happened.
    if (!started) return
    a.play().catch(() => {})
  }

  function unlock(){
    // Called on first user gesture to allow playback.
    started = true
    if (enabled.value) startIfPossible()
  }

  function stop(){
    const a = getAudioEl(volume.value)
    if (!a) return
    a.pause()
  }

  watch(enabled, (v) => {
    if (!process.client) return
    if (v) startIfPossible()
    else stop()
  })

  watch(volume, (v) => {
    const a = getAudioEl(v)
    if (a) a.volume = clamp(v, 0, 1)
  })

  return { enabled, label, toggle, unlock, startIfPossible, stop, setEnabled, volume, volumePct, setVolume }
}
