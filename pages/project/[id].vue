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
      <div class="k dim2" data-reveal>{{ project.badge.toUpperCase() }} • {{ project.category.toUpperCase() }}</div>
      <div class="k title" data-reveal>( {{ project.title.toUpperCase() }} )</div>
      <p class="p lead" data-reveal>{{ project.desc }}</p>

      <div class="player" data-reveal>
        <div class="ratio">
          <iframe
            class="iframe"
            :src="`https://www.youtube-nocookie.com/embed/${project.youtubeId}?rel=0&modestbranding=1`"
            title="YouTube player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      </div>

      <div class="plaqueRow" data-reveal>
        <div class="plaque">
          <div class="k">MADE FOR</div>
          <div class="p">{{ project.madeFor }}</div>
        </div>
        <div class="plaque">
          <div class="k">APPS USED</div>
          <ul class="ul">
            <li v-for="a in project.appsUsed" :key="a" class="p li">{{ a }}</li>
          </ul>
        </div>
        <div class="plaque">
          <div class="k">DELIVERABLES</div>
          <ul class="ul">
            <li v-for="d in project.deliverables" :key="d" class="p li">{{ d }}</li>
          </ul>
        </div>
      </div>

      <div class="case" data-reveal>
        <div class="panel">
          <div class="k">GOAL</div>
          <p class="p">{{ project.caseStudy.goal }}</p>
        </div>
        <div class="panel">
          <div class="k">APPROACH</div>
          <p class="p">{{ project.caseStudy.approach }}</p>
        </div>
        <div class="panel">
          <div class="k">EDITING DECISIONS</div>
          <ul class="ul">
            <li v-for="d in project.caseStudy.editingDecisions" :key="d" class="p li">{{ d }}</li>
          </ul>
        </div>
        <div class="panel">
          <div class="k">WHAT IMPROVED</div>
          <ul class="ul">
            <li v-for="x in project.caseStudy.improved" :key="x" class="p li">{{ x }}</li>
          </ul>
        </div>
      </div>

      <div class="tags" data-reveal>
        <span v-for="t in project.tags" :key="t" class="k dim2 tag">{{ t }}</span>
      </div>

      <div class="cta" data-reveal>
        <a class="k link" :href="project.link" target="_blank" rel="noreferrer">( VIEW PROJECT )</a>
        <button class="k dim2 link" @click="navigateTo('/')">( BACK TO WORK )</button>
      </div>
    </section>

    <FooterNav
      :current="currentIndex"
      :total="total"
      :year="String(new Date().getFullYear())"
      :showBack="true"
      @back="navigateTo('/')"
      @listing="navigateTo('/')"
      @jump="jumpTo"
    />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { projects } from '~/composables/useProjects'

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const project = computed(() => projects.find(p => p.id === id.value) || projects[0])

const total = computed(() => projects.length)
const currentIndex = computed(() => Math.max(0, projects.findIndex(p => p.id === project.value.id)))

function jumpTo(i:number){
  const p = projects[i]
  if (!p) return
  navigateTo(`/project/${p.id}`)
}
</script>

<style scoped>
.body{
  flex:1;
  padding-top: 6vh;
  padding-bottom: 6vh;
  max-width: 980px;
  margin: 0 auto;
}
.title{
  margin-top: 10px;
  margin-bottom: 8px;
}
.lead{
  margin: 0 0 18px;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
  text-transform:none;
  letter-spacing: 0.01em;
  line-height: 1.65;
  font-size: calc(var(--fs) * 1.02);
}
.player{
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  padding: 12px;
}
.ratio{
  position:relative;
  width:100%;
  aspect-ratio: 16/9;
  overflow:hidden;
}
.iframe{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}

.plaqueRow{
  margin-top: 16px;
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.plaque{
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  padding: 14px;
}
.case{
  margin-top: 16px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.panel{
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  padding: 16px;
}
.p{
  margin: 10px 0 0;
  text-transform:none;
  letter-spacing: 0.01em;
  line-height: 1.65;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
  font-size: calc(var(--fs) * 1.02);
}
.ul{ margin: 10px 0 0; padding-left: 16px; }
.li{ margin-top: 8px; }

.tags{
  margin-top: 14px;
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  justify-content:flex-end;
}
.tag{
  border: 1px solid var(--line);
  padding: 6px 8px;
}
.cta{
  margin-top: 18px;
  display:flex;
  gap: 12px;
  justify-content:flex-end;
  flex-wrap:wrap;
}

@media (max-width: 860px){
  .plaqueRow{ grid-template-columns: 1fr; }
  .case{ grid-template-columns: 1fr; }
}
</style>
