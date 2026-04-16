<template>
  <div ref="mountRef" class="etherShell" :class="`is-${theme}`" aria-hidden="true" />
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import * as THREE from 'three'

const { theme } = useTheme()
const mountRef = ref<HTMLDivElement | null>(null)

const mouseForce = 16
const cursorSize = 80
const isViscous = true
const viscous = 100
const iterationsViscous = 32
const iterationsPoisson = 32
const dt = 0.014
const BFECC = true
const resolution = 0.5
const isBounce = false
const autoDemo = true
const autoSpeed = 0.5
const autoIntensity = 2.2
const takeoverDuration = 0.25
const autoResumeDelay = 1000
const autoRampDuration = 0.6

let teardown: (() => void) | null = null

function reduced(){
  if (!process.client) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getThemeColors(){
  if (theme.value === 'light') {
    return ['#5227FF', '#000000']
  }
  return ['#5227FF', '#ffffff']
}

function initLiquidEther(){
  if (!process.client || reduced()) return
  const container = mountRef.value
  if (!container) return

  teardown?.()
  container.innerHTML = ''

  const colors = getThemeColors()
  const rafRef = { current: null as number | null }
  const resizeObserverRef = { current: null as ResizeObserver | null }
  const isVisibleRef = { current: true }
  const resizeRafRef = { current: null as number | null }

  function makePaletteTexture(stops: string[]): THREE.DataTexture {
    let arr: string[]
    if (Array.isArray(stops) && stops.length > 0) {
      arr = stops.length === 1 ? [stops[0], stops[0]] : stops
    } else {
      arr = ['#ffffff', '#ffffff']
    }
    const w = arr.length
    const data = new Uint8Array(w * 4)
    for (let i = 0; i < w; i++) {
      const c = new THREE.Color(arr[i])
      data[i * 4 + 0] = Math.round(c.r * 255)
      data[i * 4 + 1] = Math.round(c.g * 255)
      data[i * 4 + 2] = Math.round(c.b * 255)
      data[i * 4 + 3] = 255
    }
    const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat)
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.generateMipmaps = false
    tex.needsUpdate = true
    return tex
  }

  const paletteTex = makePaletteTexture(colors)
  const bgVec4 = new THREE.Vector4(0, 0, 0, 0)

  class CommonClass {
    width = 0
    height = 0
    aspect = 1
    pixelRatio = 1
    container: HTMLElement | null = null
    renderer: THREE.WebGLRenderer | null = null
    clock: THREE.Clock | null = null
    time = 0
    delta = 0

    init(containerEl: HTMLElement) {
      this.container = containerEl
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      this.resize()
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.autoClear = false
      this.renderer.setClearColor(new THREE.Color(0x000000), 0)
      this.renderer.setPixelRatio(this.pixelRatio)
      this.renderer.setSize(this.width, this.height)
      const el = this.renderer.domElement
      el.style.width = '100%'
      el.style.height = '100%'
      el.style.display = 'block'
      el.style.filter = theme.value === 'light' ? 'contrast(115%) saturate(108%)' : 'contrast(120%) saturate(112%)'
      this.clock = new THREE.Clock()
      this.clock.start()
    }

    resize() {
      if (!this.container) return
      const rect = this.container.getBoundingClientRect()
      this.width = Math.max(1, Math.floor(rect.width))
      this.height = Math.max(1, Math.floor(rect.height))
      this.aspect = this.width / this.height
      if (this.renderer) this.renderer.setSize(this.width, this.height, false)
    }

    update() {
      if (!this.clock) return
      this.delta = this.clock.getDelta()
      this.time += this.delta
    }
  }
  const Common = new CommonClass()

  class MouseClass {
    mouseMoved = false
    coords = new THREE.Vector2()
    coords_old = new THREE.Vector2()
    diff = new THREE.Vector2()
    timer: number | null = null
    container: HTMLElement | null = null
    docTarget: Document | null = null
    listenerTarget: Window | null = null
    isHoverInside = false
    hasUserControl = false
    isAutoActive = false
    autoIntensity = 2.0
    takeoverActive = false
    takeoverStartTime = 0
    takeoverDuration = 0.25
    takeoverFrom = new THREE.Vector2()
    takeoverTo = new THREE.Vector2()
    onInteract: (() => void) | null = null

    private _onMouseMove = this.onDocumentMouseMove.bind(this)
    private _onTouchStart = this.onDocumentTouchStart.bind(this)
    private _onTouchMove = this.onDocumentTouchMove.bind(this)
    private _onTouchEnd = this.onTouchEnd.bind(this)
    private _onDocumentLeave = this.onDocumentLeave.bind(this)

    init(containerEl: HTMLElement) {
      this.container = containerEl
      this.docTarget = containerEl.ownerDocument || null
      const defaultView = this.docTarget?.defaultView || window
      this.listenerTarget = defaultView
      this.listenerTarget.addEventListener('mousemove', this._onMouseMove)
      this.listenerTarget.addEventListener('touchstart', this._onTouchStart, { passive: true })
      this.listenerTarget.addEventListener('touchmove', this._onTouchMove, { passive: true })
      this.listenerTarget.addEventListener('touchend', this._onTouchEnd)
      this.docTarget?.addEventListener('mouseleave', this._onDocumentLeave)
    }

    dispose() {
      if (this.listenerTarget) {
        this.listenerTarget.removeEventListener('mousemove', this._onMouseMove)
        this.listenerTarget.removeEventListener('touchstart', this._onTouchStart)
        this.listenerTarget.removeEventListener('touchmove', this._onTouchMove)
        this.listenerTarget.removeEventListener('touchend', this._onTouchEnd)
      }
      this.docTarget?.removeEventListener('mouseleave', this._onDocumentLeave)
      if (this.timer) window.clearTimeout(this.timer)
      this.listenerTarget = null
      this.docTarget = null
      this.container = null
    }

    private isPointInside(clientX: number, clientY: number) {
      if (!this.container) return false
      const rect = this.container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return false
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    }

    private updateHoverState(clientX: number, clientY: number) {
      this.isHoverInside = this.isPointInside(clientX, clientY)
      return this.isHoverInside
    }

    setCoords(x: number, y: number) {
      if (!this.container) return
      if (this.timer) window.clearTimeout(this.timer)
      const rect = this.container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const nx = (x - rect.left) / rect.width
      const ny = (y - rect.top) / rect.height
      this.coords.set(nx * 2 - 1, -(ny * 2 - 1))
      this.mouseMoved = true
      this.timer = window.setTimeout(() => {
        this.mouseMoved = false
      }, 100)
    }

    setNormalized(nx: number, ny: number) {
      this.coords.set(nx, ny)
      this.mouseMoved = true
    }

    onDocumentMouseMove(event: MouseEvent) {
      if (!this.updateHoverState(event.clientX, event.clientY)) return
      this.onInteract?.()
      if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
        if (!this.container) return
        const rect = this.container.getBoundingClientRect()
        const nx = (event.clientX - rect.left) / rect.width
        const ny = (event.clientY - rect.top) / rect.height
        this.takeoverFrom.copy(this.coords)
        this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1))
        this.takeoverStartTime = performance.now()
        this.takeoverActive = true
        this.hasUserControl = true
        this.isAutoActive = false
        return
      }
      this.setCoords(event.clientX, event.clientY)
      this.hasUserControl = true
    }

    onDocumentTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) return
      const t = event.touches[0]
      if (!this.updateHoverState(t.clientX, t.clientY)) return
      this.onInteract?.()
      this.setCoords(t.clientX, t.clientY)
      this.hasUserControl = true
    }

    onDocumentTouchMove(event: TouchEvent) {
      if (event.touches.length !== 1) return
      const t = event.touches[0]
      if (!this.updateHoverState(t.clientX, t.clientY)) return
      this.onInteract?.()
      this.setCoords(t.clientX, t.clientY)
    }

    onTouchEnd() {
      this.isHoverInside = false
    }

    onDocumentLeave() {
      this.isHoverInside = false
    }

    update() {
      if (this.takeoverActive) {
        const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000)
        if (t >= 1) {
          this.takeoverActive = false
          this.coords.copy(this.takeoverTo)
          this.coords_old.copy(this.coords)
          this.diff.set(0, 0)
        } else {
          const k = t * t * (3 - 2 * t)
          this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k)
        }
      }
      this.diff.subVectors(this.coords, this.coords_old)
      this.coords_old.copy(this.coords)
      if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0)
      if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity)
    }
  }
  const Mouse = new MouseClass()

  const face_vert = `
attribute vec3 position;
uniform vec2 px;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
vec3 pos = position;
vec2 scale = 1.0 - boundarySpace * 2.0;
pos.xy = pos.xy * scale;
uv = vec2(0.5)+(pos.xy)*0.5;
gl_Position = vec4(pos, 1.0);
}
`
  const line_vert = `
attribute vec3 position;
uniform vec2 px;
precision highp float;
varying vec2 uv;
void main(){
vec3 pos = position;
uv = 0.5 + pos.xy * 0.5;
vec2 n = sign(pos.xy);
pos.xy = abs(pos.xy) - px * 1.0;
pos.xy *= n;
gl_Position = vec4(pos, 1.0);
}
`
  const mouse_vert = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
vec2 pos = position.xy * scale * 2.0 * px + center;
vUv = uv;
gl_Position = vec4(pos, 0.0, 1.0);
}
`
  const advection_frag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform bool isBFECC;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;
void main(){
vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
if(isBFECC == false){
vec2 vel = texture2D(velocity, uv).xy;
vec2 uv2 = uv - vel * dt * ratio;
vec2 newVel = texture2D(velocity, uv2).xy;
gl_FragColor = vec4(newVel, 0.0, 0.0);
} else {
vec2 spot_new = uv;
vec2 vel_old = texture2D(velocity, uv).xy;
vec2 spot_old = spot_new - vel_old * dt * ratio;
vec2 vel_new1 = texture2D(velocity, spot_old).xy;
vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
vec2 error = spot_new2 - spot_new;
vec2 spot_new3 = spot_new - error / 2.0;
vec2 vel_2 = texture2D(velocity, spot_new3).xy;
vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
vec2 newVel2 = texture2D(velocity, spot_old2).xy;
gl_FragColor = vec4(newVel2, 0.0, 0.0);
}
}
`
  const color_frag = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
varying vec2 uv;
void main(){
vec2 vel = texture2D(velocity, uv).xy;
float lenv = clamp(length(vel), 0.0, 1.0);
vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
vec3 outRGB = mix(bgColor.rgb, c, lenv);
float outA = mix(bgColor.a, 1.0, lenv);
gl_FragColor = vec4(outRGB, outA);
}
`
  const divergence_frag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main(){
float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
float divergence = (x1 - x0 + y1 - y0) / 2.0;
gl_FragColor = vec4(divergence / dt);
}
`
  const externalForce_frag = `
precision highp float;
uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
vec2 circle = (vUv - 0.5) * 2.0;
float d = 1.0 - min(length(circle), 1.0);
d *= d;
gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`
  const poisson_frag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main(){
float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
float div = texture2D(divergence, uv).r;
float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
gl_FragColor = vec4(newP);
}
`
  const pressure_frag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
float step = 1.0;
float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;
float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;
float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;
float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;
vec2 v = texture2D(velocity, uv).xy;
vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
v = v - gradP * dt;
gl_FragColor = vec4(v, 0.0, 1.0);
}
`
  const viscous_frag = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D velocity_new;
uniform float v;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
vec2 old = texture2D(velocity, uv).xy;
vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
newv /= 4.0 * (1.0 + v * dt);
gl_FragColor = vec4(newv, 0.0, 0.0);
}
`

  type Uniforms = Record<string, { value: any }>

  class ShaderPass {
    props: any
    uniforms?: Uniforms
    scene: THREE.Scene | null = null
    camera: THREE.Camera | null = null
    material: THREE.RawShaderMaterial | null = null
    geometry: THREE.BufferGeometry | null = null
    plane: THREE.Mesh | null = null

    constructor(props: any) {
      this.props = props || {}
      this.uniforms = this.props.material?.uniforms
    }

    init() {
      this.scene = new THREE.Scene()
      this.camera = new THREE.Camera()
      if (this.uniforms) {
        this.material = new THREE.RawShaderMaterial(this.props.material)
        this.geometry = new THREE.PlaneGeometry(2, 2)
        this.plane = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.plane)
      }
    }

    update() {
      if (!Common.renderer || !this.scene || !this.camera) return
      Common.renderer.setRenderTarget(this.props.output || null)
      Common.renderer.render(this.scene, this.camera)
      Common.renderer.setRenderTarget(null)
    }
  }

  class Advection extends ShaderPass {
    line!: THREE.LineSegments
    constructor(simProps: any) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: advection_frag,
          uniforms: {
            boundarySpace: { value: simProps.cellScale },
            px: { value: simProps.cellScale },
            fboSize: { value: simProps.fboSize },
            velocity: { value: simProps.src.texture },
            dt: { value: simProps.dt },
            isBFECC: { value: true }
          }
        },
        output: simProps.dst
      })
      this.uniforms = this.props.material.uniforms
      this.init()
    }

    override init() {
      super.init()
      const boundaryG = new THREE.BufferGeometry()
      const verticesBoundary = new Float32Array([
        -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0
      ])
      boundaryG.setAttribute('position', new THREE.BufferAttribute(verticesBoundary, 3))
      const boundaryM = new THREE.RawShaderMaterial({
        vertexShader: line_vert,
        fragmentShader: advection_frag,
        uniforms: this.uniforms!
      })
      this.line = new THREE.LineSegments(boundaryG, boundaryM)
      this.scene!.add(this.line)
    }

    override update(args?: { dt?: number; isBounce?: boolean; BFECC?: boolean }) {
      if (!this.uniforms) return
      if (typeof args?.dt === 'number') this.uniforms.dt.value = args.dt
      if (typeof args?.isBounce === 'boolean') this.line.visible = args.isBounce
      if (typeof args?.BFECC === 'boolean') this.uniforms.isBFECC.value = args.BFECC
      super.update()
    }
  }

  class ExternalForce extends ShaderPass {
    mouse!: THREE.Mesh
    constructor(simProps: any) {
      super({ output: simProps.dst })
      this.initWith(simProps)
    }

    initWith(simProps: any) {
      super.init()
      const mouseG = new THREE.PlaneGeometry(1, 1)
      const mouseM = new THREE.RawShaderMaterial({
        vertexShader: mouse_vert,
        fragmentShader: externalForce_frag,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          px: { value: simProps.cellScale },
          force: { value: new THREE.Vector2(0, 0) },
          center: { value: new THREE.Vector2(0, 0) },
          scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
        }
      })
      this.mouse = new THREE.Mesh(mouseG, mouseM)
      this.scene!.add(this.mouse)
    }

    override update(args?: any) {
      const forceX = (Mouse.diff.x / 2) * (args?.mouse_force || 0)
      const forceY = (Mouse.diff.y / 2) * (args?.mouse_force || 0)
      const cellScale = args?.cellScale || { x: 1, y: 1 }
      const currentCursorSize = args?.cursor_size || 0
      const cursorSizeX = currentCursorSize * cellScale.x
      const cursorSizeY = currentCursorSize * cellScale.y
      const centerX = Math.min(Math.max(Mouse.coords.x, -1 + cursorSizeX + cellScale.x * 2), 1 - cursorSizeX - cellScale.x * 2)
      const centerY = Math.min(Math.max(Mouse.coords.y, -1 + cursorSizeY + cellScale.y * 2), 1 - cursorSizeY - cellScale.y * 2)
      const uniforms = (this.mouse.material as THREE.RawShaderMaterial).uniforms
      uniforms.force.value.set(forceX, forceY)
      uniforms.center.value.set(centerX, centerY)
      uniforms.scale.value.set(currentCursorSize, currentCursorSize)
      super.update()
    }
  }

  class Viscous extends ShaderPass {
    constructor(simProps: any) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: viscous_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            velocity: { value: simProps.src.texture },
            velocity_new: { value: simProps.dst_.texture },
            v: { value: simProps.viscous },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst,
        output0: simProps.dst_,
        output1: simProps.dst
      })
      this.init()
    }

    override update(args?: { viscous?: number; iterations?: number; dt?: number }) {
      if (!this.uniforms) return this.props.output
      let fboIn: any
      let fboOut: any
      if (typeof args?.viscous === 'number') this.uniforms.v.value = args.viscous
      const iter = args?.iterations ?? 0
      for (let i = 0; i < iter; i++) {
        if (i % 2 === 0) {
          fboIn = this.props.output0
          fboOut = this.props.output1
        } else {
          fboIn = this.props.output1
          fboOut = this.props.output0
        }
        this.uniforms.velocity_new.value = fboIn.texture
        this.props.output = fboOut
        if (typeof args?.dt === 'number') this.uniforms.dt.value = args.dt
        super.update()
      }
      return fboOut
    }
  }

  class Divergence extends ShaderPass {
    constructor(simProps: any) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: divergence_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            velocity: { value: simProps.src.texture },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      })
      this.init()
    }

    override update(args?: { vel?: any }) {
      if (this.uniforms && args?.vel) this.uniforms.velocity.value = args.vel.texture
      super.update()
    }
  }

  class Poisson extends ShaderPass {
    constructor(simProps: any) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: poisson_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            pressure: { value: simProps.dst_.texture },
            divergence: { value: simProps.src.texture },
            px: { value: simProps.cellScale }
          }
        },
        output: simProps.dst,
        output0: simProps.dst_,
        output1: simProps.dst
      })
      this.init()
    }

    override update(args?: { iterations?: number }) {
      let pIn: any
      let pOut: any
      const iter = args?.iterations ?? 0
      for (let i = 0; i < iter; i++) {
        if (i % 2 === 0) {
          pIn = this.props.output0
          pOut = this.props.output1
        } else {
          pIn = this.props.output1
          pOut = this.props.output0
        }
        if (this.uniforms) this.uniforms.pressure.value = pIn.texture
        this.props.output = pOut
        super.update()
      }
      return pOut
    }
  }

  class Pressure extends ShaderPass {
    constructor(simProps: any) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: pressure_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            pressure: { value: simProps.src_p.texture },
            velocity: { value: simProps.src_v.texture },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      })
      this.init()
    }

    override update(args?: { vel?: any; pressure?: any }) {
      if (this.uniforms && args?.vel && args?.pressure) {
        this.uniforms.velocity.value = args.vel.texture
        this.uniforms.pressure.value = args.pressure.texture
      }
      super.update()
    }
  }

  class Simulation {
    options = {
      iterations_poisson: iterationsPoisson,
      iterations_viscous: iterationsViscous,
      mouse_force: mouseForce,
      resolution,
      cursor_size: cursorSize,
      viscous,
      isBounce,
      dt,
      isViscous,
      BFECC
    }
    fbos: Record<string, THREE.WebGLRenderTarget | null> = {
      vel_0: null,
      vel_1: null,
      vel_viscous0: null,
      vel_viscous1: null,
      div: null,
      pressure_0: null,
      pressure_1: null
    }
    fboSize = new THREE.Vector2()
    cellScale = new THREE.Vector2()
    boundarySpace = new THREE.Vector2()
    advection!: Advection
    externalForce!: ExternalForce
    viscousPass!: Viscous
    divergence!: Divergence
    poisson!: Poisson
    pressurePass!: Pressure

    constructor() {
      this.init()
    }

    init() {
      this.calcSize()
      this.createAllFBO()
      this.createShaderPass()
    }

    getFloatType() {
      const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent)
      return isIOS ? THREE.HalfFloatType : THREE.FloatType
    }

    createAllFBO() {
      const type = this.getFloatType()
      const opts = {
        type,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping
      } as const
      for (const key in this.fbos) {
        this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts)
      }
    }

    createShaderPass() {
      this.advection = new Advection({
        cellScale: this.cellScale,
        fboSize: this.fboSize,
        dt: this.options.dt,
        src: this.fbos.vel_0,
        dst: this.fbos.vel_1
      })
      this.externalForce = new ExternalForce({
        cellScale: this.cellScale,
        cursor_size: this.options.cursor_size,
        dst: this.fbos.vel_1
      })
      this.viscousPass = new Viscous({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        viscous: this.options.viscous,
        src: this.fbos.vel_1,
        dst: this.fbos.vel_viscous1,
        dst_: this.fbos.vel_viscous0,
        dt: this.options.dt
      })
      this.divergence = new Divergence({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src: this.fbos.vel_viscous0,
        dst: this.fbos.div,
        dt: this.options.dt
      })
      this.poisson = new Poisson({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src: this.fbos.div,
        dst: this.fbos.pressure_1,
        dst_: this.fbos.pressure_0
      })
      this.pressurePass = new Pressure({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src_p: this.fbos.pressure_0,
        src_v: this.fbos.vel_viscous0,
        dst: this.fbos.vel_0,
        dt: this.options.dt
      })
    }

    calcSize() {
      const width = Math.max(1, Math.round(this.options.resolution * Common.width))
      const height = Math.max(1, Math.round(this.options.resolution * Common.height))
      this.cellScale.set(1 / width, 1 / height)
      this.fboSize.set(width, height)
    }

    resize() {
      this.calcSize()
      for (const key in this.fbos) {
        this.fbos[key]!.setSize(this.fboSize.x, this.fboSize.y)
      }
    }

    update() {
      if (this.options.isBounce) this.boundarySpace.set(0, 0)
      else this.boundarySpace.copy(this.cellScale)

      this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC })
      this.externalForce.update({
        cursor_size: this.options.cursor_size,
        mouse_force: this.options.mouse_force,
        cellScale: this.cellScale
      })

      let vel: any = this.fbos.vel_1
      if (this.options.isViscous) {
        vel = this.viscousPass.update({
          viscous: this.options.viscous,
          iterations: this.options.iterations_viscous,
          dt: this.options.dt
        })
      }

      this.divergence.update({ vel })
      const pressure = this.poisson.update({ iterations: this.options.iterations_poisson })
      this.pressurePass.update({ vel, pressure })
    }

    dispose() {
      Object.values(this.fbos).forEach(fbo => fbo?.dispose())
    }
  }

  class Output {
    simulation: Simulation
    scene: THREE.Scene
    camera: THREE.Camera
    output: THREE.Mesh

    constructor() {
      this.simulation = new Simulation()
      this.scene = new THREE.Scene()
      this.camera = new THREE.Camera()
      this.output = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
          vertexShader: face_vert,
          fragmentShader: color_frag,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: { value: this.simulation.fbos.vel_0!.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTex },
            bgColor: { value: bgVec4 }
          }
        })
      )
      this.scene.add(this.output)
    }

    resize() {
      this.simulation.resize()
    }

    render() {
      if (!Common.renderer) return
      Common.renderer.setRenderTarget(null)
      Common.renderer.render(this.scene, this.camera)
    }

    update() {
      this.simulation.update()
      this.render()
    }

    dispose() {
      this.simulation.dispose()
      ;(this.output.material as THREE.Material).dispose()
      this.output.geometry.dispose()
    }
  }

  class AutoDriver {
    mouse: MouseClass
    manager: WebGLManager
    enabled: boolean
    speed: number
    resumeDelay: number
    rampDurationMs: number
    active = false
    current = new THREE.Vector2(0, 0)
    target = new THREE.Vector2()
    lastTime = performance.now()
    activationTime = 0
    margin = 0.2
    private tmpDir = new THREE.Vector2()

    constructor(mouseObj: MouseClass, manager: WebGLManager, opts: { enabled: boolean; speed: number; resumeDelay: number; rampDuration: number }) {
      this.mouse = mouseObj
      this.manager = manager
      this.enabled = opts.enabled
      this.speed = opts.speed
      this.resumeDelay = opts.resumeDelay || 3000
      this.rampDurationMs = (opts.rampDuration || 0) * 1000
      this.pickNewTarget()
    }

    pickNewTarget() {
      const r = Math.random
      this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin))
    }

    forceStop() {
      this.active = false
      this.mouse.isAutoActive = false
    }

    update() {
      if (!this.enabled) return
      const now = performance.now()
      const idle = now - this.manager.lastUserInteraction
      if (idle < this.resumeDelay) {
        if (this.active) this.forceStop()
        return
      }
      // Full-screen background means the pointer is almost always "inside",
      // so we do not use hover state to suppress auto-demo here.
      if (!this.active) {
        this.active = true
        this.current.copy(this.mouse.coords)
        this.lastTime = now
        this.activationTime = now
      }
      this.mouse.isAutoActive = true
      let dtSec = (now - this.lastTime) / 1000
      this.lastTime = now
      if (dtSec > 0.2) dtSec = 0.016
      const dir = this.tmpDir.subVectors(this.target, this.current)
      const dist = dir.length()
      if (dist < 0.01) {
        this.pickNewTarget()
        return
      }
      dir.normalize()
      let ramp = 1
      if (this.rampDurationMs > 0) {
        const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs)
        ramp = t * t * (3 - 2 * t)
      }
      const step = this.speed * dtSec * ramp
      const move = Math.min(step, dist)
      this.current.addScaledVector(dir, move)
      this.mouse.setNormalized(this.current.x, this.current.y)
    }
  }

  class WebGLManager {
    output!: Output
    autoDriver?: AutoDriver
    lastUserInteraction = performance.now()
    running = false
    private loopBound = this.loop.bind(this)
    private resizeBound = this.resize.bind(this)
    private onVisibility?: () => void

    constructor(private props: any) {
      Common.init(props.$wrapper)
      Mouse.init(props.$wrapper)
      Mouse.autoIntensity = props.autoIntensity
      Mouse.takeoverDuration = props.takeoverDuration
      Mouse.onInteract = () => {
        this.lastUserInteraction = performance.now()
        this.autoDriver?.forceStop()
      }
      this.autoDriver = new AutoDriver(Mouse, this, {
        enabled: props.autoDemo,
        speed: props.autoSpeed,
        resumeDelay: props.autoResumeDelay,
        rampDuration: props.autoRampDuration
      })
      this.init()
      window.addEventListener('resize', this.resizeBound)
      this.onVisibility = () => {
        if (document.hidden) this.pause()
        else this.start()
      }
      document.addEventListener('visibilitychange', this.onVisibility)
    }

    init() {
      if (!Common.renderer) return
      this.props.$wrapper.prepend(Common.renderer.domElement)
      this.output = new Output()
    }

    resize() {
      Common.resize()
      this.output.resize()
    }

    render() {
      this.autoDriver?.update()
      Mouse.update()
      Common.update()
      this.output.update()
    }

    loop() {
      if (!this.running) return
      this.render()
      rafRef.current = requestAnimationFrame(this.loopBound)
    }

    start() {
      if (this.running) return
      this.running = true
      this.loop()
    }

    pause() {
      this.running = false
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    dispose() {
      try {
        window.removeEventListener('resize', this.resizeBound)
        if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility)
        Mouse.dispose()
        this.output?.dispose()
        if (Common.renderer) {
          const canvas = Common.renderer.domElement
          if (canvas?.parentNode) canvas.parentNode.removeChild(canvas)
          Common.renderer.dispose()
          Common.renderer.forceContextLoss()
        }
        paletteTex.dispose()
      } catch {}
    }
  }

  container.style.position = 'relative'
  container.style.overflow = 'hidden'

  const webgl = new WebGLManager({
    $wrapper: container,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration
  })
  webgl.start()

  window.setTimeout(() => {
    if (!document.hidden) webgl.start()
  }, 120)

  const ro = new ResizeObserver(() => {
    if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current)
    resizeRafRef.current = requestAnimationFrame(() => webgl.resize())
  })
  ro.observe(container)
  resizeObserverRef.current = ro

  teardown = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current)
    try { resizeObserverRef.current?.disconnect() } catch {}
    webgl.dispose()
    container.innerHTML = ''
  }
}

watch(theme, async () => {
  if (!process.client) return
  await nextTick()
  initLiquidEther()
})

onMounted(() => {
  if (!process.client || reduced()) return
  initLiquidEther()
})

onBeforeUnmount(() => {
  teardown?.()
})
</script>

<style scoped>
.etherShell {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  background: #120f17;
}

.etherShell :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
  opacity: 0.95;
  transform: scale(1.04);
}

.etherShell.is-light {
  background: #f4f1fb;
}

.etherShell.is-light :deep(canvas) {
  opacity: 0.82;
}

@media (prefers-reduced-motion: reduce) {
  .etherShell {
    display: none;
  }
}
</style>
