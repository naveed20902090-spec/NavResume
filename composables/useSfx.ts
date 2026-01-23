import { watch } from 'vue'
import { useAudio } from '~/composables/useAudio'
import { useTheme } from '~/composables/useTheme'

let ctx: AudioContext | null = null

let masterDry: GainNode | null = null
let masterWet: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let convolver: ConvolverNode | null = null

let ambienceNoiseSrc: AudioBufferSourceNode | null = null
let ambienceToneOsc1: OscillatorNode | null = null
let ambienceToneOsc2: OscillatorNode | null = null
let ambienceLfo: OscillatorNode | null = null
let ambienceGain: GainNode | null = null
let ambienceToneGain: GainNode | null = null

let unlocked = false

// User feedback: SFX were still too quiet compared to BGM.
// Keep clicks only slightly louder, but make hover/nav/whoosh much louder.
const SFX_BOOST = 1.55
const SFX_CLICK_EXTRA = 1.25   // slight bump
const SFX_OTHER_EXTRA = 4.0    // big boost for hover/nav
const SFX_WHOOSH_EXTRA = 5.0   // biggest boost for transitions

function clamp(v:number, min=0, max=1){ return Math.min(max, Math.max(min, v)) }

function peakClick(v:number){
  // Clicks: only a modest increase.
  return clamp(v * SFX_BOOST * SFX_CLICK_EXTRA, 0, 0.75)
}

function peakOther(v:number){
  // Hover + nav: clearly audible over BGM.
  return clamp(v * SFX_BOOST * SFX_OTHER_EXTRA, 0, 0.95)
}

function peakWhoosh(v:number){
  // Transitions: the main impact.
  return clamp(v * SFX_BOOST * SFX_WHOOSH_EXTRA, 0, 0.98)
}

function ensureCtx(){
  if (!process.client) return null
  if (!ctx){
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
    ctx = new Ctx()

    // Master chain: (dry + wet) -> gentle compressor -> destination
    compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -22
    compressor.knee.value = 18
    compressor.ratio.value = 2.7
    compressor.attack.value = 0.008
    compressor.release.value = 0.22

    masterDry = ctx.createGain()
    masterWet = ctx.createGain()

    // Museum-quiet, still cinematic — but audible over BGM.
    masterDry.gain.value = clamp(0.62 * SFX_BOOST, 0, 1.0)
    masterWet.gain.value = clamp(0.26 * SFX_BOOST, 0, 0.6)

    masterDry.connect(compressor)
    masterWet.connect(compressor)
    compressor.connect(ctx.destination)

    // Reverb (short + soft)
    convolver = ctx.createConvolver()
    convolver.buffer = makeImpulse(ctx, 0.9, 2.4)
    const wetPost = ctx.createGain()
    wetPost.gain.value = 1.0
    convolver.connect(wetPost)
    wetPost.connect(masterWet)
  }
  return ctx
}

function makeImpulse(c: AudioContext, seconds = 1.0, decay = 2.0){
  const len = Math.max(1, Math.floor(c.sampleRate * seconds))
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch=0; ch<2; ch++){
    const data = buf.getChannelData(ch)
    for (let i=0;i<len;i++){
      const t = i / len
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay)
    }
  }
  return buf
}

function envGain(c: AudioContext, attack: number, release: number, peak = 0.2){
  const g = c.createGain()
  const t = c.currentTime
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
  return g
}

function noiseBuffer(c: AudioContext, seconds = 0.2){
  const length = Math.max(1, Math.floor(c.sampleRate * seconds))
  const buf = c.createBuffer(1, length, c.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i=0;i<length;i++){
    const w = Math.random() * 2 - 1
    last = (last * 0.93) + (w * 0.07)
    // subtle taper
    data[i] = last * (1 - i / length)
  }
  return buf
}

function routeDry(node: AudioNode){
  if (!masterDry) return
  node.connect(masterDry)
}
function routeWet(node: AudioNode){
  if (!convolver) return
  node.connect(convolver)
}

function stopAmbience(){
  try{ ambienceNoiseSrc?.stop() } catch { /* ignore */ }
  try{ ambienceToneOsc1?.stop() } catch { /* ignore */ }
  try{ ambienceToneOsc2?.stop() } catch { /* ignore */ }
  try{ ambienceLfo?.stop() } catch { /* ignore */ }
  ambienceNoiseSrc = null
  ambienceToneOsc1 = null
  ambienceToneOsc2 = null
  ambienceLfo = null
  ambienceGain = null
  ambienceToneGain = null
}

function startAmbience(){
  if (!process.client) return
  const c = ensureCtx()
  if (!c || !masterWet || ambienceNoiseSrc) return

  // Ultra-soft air bed (dark mode only)
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 3.0)
  src.loop = true

  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 26
  hp.Q.value = 0.7

  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 190
  lp.Q.value = 0.6

  const g = c.createGain()
  g.gain.value = 0.012

  src.connect(hp)
  hp.connect(lp)
  lp.connect(g)
  routeWet(g)

  // Tonal layer (2B): barely-there harmonic bed
  const t1 = c.createOscillator()
  t1.type = 'sine'
  t1.frequency.value = 55

  const t2 = c.createOscillator()
  t2.type = 'sine'
  t2.frequency.value = 110
  t2.detune.value = 3

  const toneLp = c.createBiquadFilter()
  toneLp.type = 'lowpass'
  toneLp.frequency.value = 160
  toneLp.Q.value = 0.8

  const tg = c.createGain()
  tg.gain.value = 0.006

  // slow movement
  const lfo = c.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.08
  const lfoAmt = c.createGain()
  lfoAmt.gain.value = 0.003
  lfo.connect(lfoAmt)
  lfoAmt.connect(tg.gain)

  t1.connect(toneLp)
  t2.connect(toneLp)
  toneLp.connect(tg)
  routeWet(tg)

  src.start()
  t1.start()
  t2.start()
  lfo.start()

  ambienceNoiseSrc = src
  ambienceGain = g
  ambienceToneOsc1 = t1
  ambienceToneOsc2 = t2
  ambienceToneGain = tg
  ambienceLfo = lfo
}

export function useSfx(){
  const { enabled, unlock } = useAudio()
  const { theme } = useTheme()

  function resume(){
    const c = ensureCtx()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})
    unlocked = true
    unlock()
  }

  // A1: Premium, cinematic, but restrained (no "gamey" beeps)
  function playHover(){
    if (!process.client || !enabled.value) return
    const c = ensureCtx()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})

    const t = c.currentTime

    const air = c.createBufferSource()
    air.buffer = noiseBuffer(c, 0.14)

    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 680

    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(1400, t)
    bp.frequency.linearRampToValueAtTime(2200, t + 0.10)
    bp.Q.value = 0.65

    const g = envGain(c, 0.010, 0.14, peakOther(0.09))

    air.connect(hp)
    hp.connect(bp)
    bp.connect(g)
    routeWet(g)

    air.start(t)
    air.stop(t + 0.18)
  }

  // 3A: navigation sound is extremely subtle; the whoosh is the "main" impact.
  function playNav(){
    if (!process.client || !enabled.value) return
    const c = ensureCtx()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})

    const t = c.currentTime

    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c, 0.05)

    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800

    const g = envGain(c, 0.0015, 0.06, peakOther(0.06))

    src.connect(hp)
    hp.connect(g)
    routeWet(g)

    src.start(t)
    src.stop(t + 0.07)
  }

  // General UI click: soft "felt" tap (still subdued)
  function playClick(){
    if (!process.client || !enabled.value) return
    const c = ensureCtx()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})

    const t = c.currentTime

    // low-mid tap
    const tap = c.createOscillator()
    tap.type = 'sine'
    tap.frequency.setValueAtTime(92, t)
    tap.frequency.exponentialRampToValueAtTime(62, t + 0.10)

    const gTap = envGain(c, 0.0018, 0.12, peakClick(0.10))
    tap.connect(gTap)
    routeDry(gTap)

    // tiny air transient
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c, 0.04)

    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1100
    bp.Q.value = 0.9

    const g = envGain(c, 0.0012, 0.08, peakClick(0.035))

    src.connect(bp)
    bp.connect(g)
    routeWet(g)

    tap.start(t)
    tap.stop(t + 0.16)
    src.start(t)
    src.stop(t + 0.06)
  }

  // Page transition whoosh: smooth "pass-by" (Zimmer-ish), not harsh.
  // Includes a very subtle sub swell (2B).
  function playWhoosh(){
    if (!process.client || !enabled.value) return
    const c = ensureCtx()
    if (!c) return
    if (c.state === 'suspended') c.resume().catch(() => {})

    const t = c.currentTime

    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c, 1.18)

    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 0.55
    bp.frequency.setValueAtTime(220, t)
    bp.frequency.linearRampToValueAtTime(1800, t + 0.55)
    bp.frequency.linearRampToValueAtTime(420, t + 1.16)

    const panner = (c.createStereoPanner ? c.createStereoPanner() : null)
    if (panner) panner.pan.setValueAtTime(-0.12, t)

    const gW = envGain(c, 0.03, 1.10, peakWhoosh(0.12))

    // Gentle pan movement
    if (panner){
      const lfo = c.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.55
      const lfoAmt = c.createGain()
      lfoAmt.gain.value = 0.11
      lfo.connect(lfoAmt)
      lfoAmt.connect(panner.pan)
      lfo.start(t)
      lfo.stop(t + 1.22)
    }

    src.connect(bp)
    if (panner){
      bp.connect(panner)
      panner.connect(gW)
    } else {
      bp.connect(gW)
    }
    routeWet(gW)

    // Sub swell (very soft)
    const sub = c.createOscillator()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(34, t)
    sub.frequency.linearRampToValueAtTime(52, t + 0.50)
    sub.frequency.linearRampToValueAtTime(30, t + 1.05)

    const gSub = envGain(c, 0.03, 1.05, peakWhoosh(0.035))
    sub.connect(gSub)
    routeDry(gSub)

    src.start(t)
    src.stop(t + 1.22)
    sub.start(t)
    sub.stop(t + 1.16)
  }

  // manage ambience (dark mode only, optional, extremely soft)
  watch([enabled, theme], ([en, th]) => {
    if (!process.client) return
    if (!en || th !== 'dark' || !unlocked) stopAmbience()
    else startAmbience()
  }, { immediate: true })

  watch(enabled, (v) => {
    if (!process.client) return
    if (!v) stopAmbience()
  })

  return { resume, playHover, playNav, playClick, playWhoosh }
}
