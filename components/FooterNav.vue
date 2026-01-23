<template>
  <footer class="ftr" data-reveal>
    <div class="left">
      <button class="k link" @click="toggleTheme">( • {{ themeLabel }} )</button>
      <button class="k link" @click="toggleSound">( • {{ soundLabel }} )</button>
      <div class="vol" aria-label="Background music volume">
        <span class="k dim2">( VOL {{ volumePct }}% )</span>
        <input class="slider" type="range" min="0" max="100" :value="volumePct" @input="(e:any)=>setVolume(Number(e.target.value)/100)" />
      </div>
      <button v-if="showBack" class="k link" @click="$emit('back')">( &lt; BACK )</button>
    </div>

    <div class="mid" aria-label="Project index">
      <div class="nums">
        <button
          v-for="i in total"
          :key="i"
          class="num k dim2"
          :class="{ on: (i-1) === current }"
          @click="$emit('jump', i-1)"
          :aria-label="`Jump to ${i}`"
        ><span class="paren">(</span><span class="n">{{ i }}</span><span class="paren">)</span></button>
      </div>
    </div>

    <div class="right">
      <button class="k link" @click="$emit('listing')">( -- VIEW LISTING )</button>
      <div class="k year">{{ year }} ©</div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'
import { useAudio } from '~/composables/useAudio'

const props = withDefaults(defineProps<{ current:number; total:number; year?: string; showBack?: boolean }>(), {
  year: '2025',
  showBack: false
})

defineEmits<{ (e:'back'):void; (e:'listing'):void; (e:'jump', i:number):void }>()

const { theme, toggle: toggleTheme } = useTheme()
const { label: soundLabel, toggle: toggleSound, volume, volumePct, setVolume } = useAudio()

// Match reference: label shows the mode you will switch to.
const themeLabel = computed(() => theme.value === 'dark' ? 'LIGHT' : 'DARK')
</script>

<style scoped>
.ftr{
  position:relative;
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:end;
  padding-bottom: 8px;
  z-index:5;
}
.left{ justify-self:start; display:flex; gap: 14px; flex-wrap:wrap; }
.mid{
  justify-self:center;
  display:flex;
  align-items:center;
}
.nums{
  display:flex;
  gap: 14px;
  align-items:center;
}
.num{
  opacity: .42;
  transition: transform .18s ease, opacity .18s ease;
}
.num:hover{ transform: scale(1.12); opacity: 1; }
.num.on{
  opacity: 1;
  animation: idxBump .28s ease;
}

.right{
  justify-self:end;
  display:flex;
  gap: 20px;
  align-items:flex-end;
}
.year{ letter-spacing: var(--ls); }
.link{ transition: opacity .18s ease; }
.link:hover{ opacity: 1; }


.vol{
  display:flex;
  align-items:center;
  gap: 10px;
  opacity: .9;
}
.slider{
  width: 120px;
  height: 2px;
  appearance: none;
  background: var(--line);
  outline: none;
}
.slider::-webkit-slider-thumb{
  appearance:none;
  width:10px;
  height:10px;
  border-radius:999px;
  background: var(--fg);
  opacity:.7;
}
.slider::-moz-range-thumb{
  width:10px;
  height:10px;
  border-radius:999px;
  background: var(--fg);
  opacity:.7;
  border:0;
}
.num .n{
  display:inline-block;
  min-width: 1.8ch;
  text-align:center;
  opacity: 0;
  transition: opacity .18s ease, transform .18s ease;
}
.num.on .n{
  opacity: 1;
  animation: idxCount .28s ease;
}
.num:hover .n{ opacity: 1; }
.num .paren{ opacity:.62; }

@keyframes idxBump{
  0%{ transform: translateY(2px) scale(0.98); opacity: .75; }
  55%{ transform: translateY(-2px) scale(1.10); opacity: 1; }
  100%{ transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes idxCount{
  0%{ transform: translateY(6px); opacity: 0; }
  60%{ transform: translateY(-1px); opacity: 1; }
  100%{ transform: translateY(0); opacity: 1; }
}


@media (prefers-reduced-motion: reduce){
  .num, .link{ transition:none; }
  .num.on{ animation:none; }
  .num.on .n{ animation:none; }
}

@media (max-width: 768px){
  .ftr{ grid-template-columns: 1fr; row-gap: 10px; }
  .right{ justify-self:start; gap: 14px; }
  .mid{ justify-self:start; }
  .nums{ gap: 10px; flex-wrap:wrap; }
}
</style>
