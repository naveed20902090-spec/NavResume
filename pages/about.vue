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
      <div class="k dim2" data-reveal>{{ site.about.kicker }}</div>
      <div class="k title" data-reveal>( ABOUT )</div>

      <div class="museum">
        <div class="leftCol">
          <div class="panel lead" data-reveal>
            <div class="k">{{ site.about.headline }}</div>
            <p class="p">{{ site.about.body }}</p>
            <div class="k dim2 metaLine">{{ site.location }}</div>
          </div>

          <div class="split">
            <div class="panel" data-reveal>
              <div class="k">STRENGTHS</div>
              <ul class="ul">
                <li v-for="s in site.about.strengths" :key="s" class="p li">{{ s }}</li>
              </ul>
            </div>

            <div class="panel" data-reveal>
              <div class="k">WORKFLOW</div>
              <ul class="ul">
                <li v-for="w in site.about.workflow" :key="w" class="p li">{{ w }}</li>
              </ul>
            </div>
          </div>
        </div>

        <aside class="rightCol">
          <figure class="portrait" data-reveal>
            <div class="mat">
              <img class="photo" src="/profile.jpg" alt="Tauseef Rahman portrait" loading="lazy" decoding="async" />
            </div>
            <figcaption class="k dim2 cap">
              {{ site.displayName.toUpperCase() }} • {{ site.handle.toUpperCase() }} • {{ site.location.toUpperCase() }}
            </figcaption>
          </figure>

          <div class="cta" data-reveal>
            <a class="k dim2" :href="`mailto:${site.contact.email}`">( HIRE VIA EMAIL )</a>
            <a class="k dim2" :href="site.hero.links.youtube" target="_blank" rel="noreferrer">( YOUTUBE )</a>
            <a class="k dim2" :href="site.hero.links.instagram" target="_blank" rel="noreferrer">( INSTAGRAM )</a>
          </div>
        </aside>
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
import { computed } from 'vue'
import { site } from '~/content/site'
import { projects } from '~/composables/useProjects'

const total = computed(() => projects.length)
</script>


<style scoped>
.body{
  flex:1;
  padding-top: 6vh;
  padding-bottom: 6vh;
}
.title{
  margin-top: 10px;
  margin-bottom: 22px;
}
.museum{
  display:grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: clamp(18px, 3.2vw, 36px);
  align-items:start;
}

.panel{
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 75%, transparent);
  padding: 18px;
}
.lead{
  padding: 22px;
}
.metaLine{
  margin-top: 14px;
}

.split{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.p{
  margin: 10px 0 0;
  font-size: calc(var(--fs) * 1.02);
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1.65;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
}
.li{ margin-top: 8px; }
.ul{ margin:10px 0 0; padding-left: 16px; }

.rightCol{
  position:relative;
}
.portrait{
  margin: 0;
}
.mat{
  border: 1px solid var(--line);
  padding: 14px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  position: sticky;
  top: 88px;
}
.photo{
  width:100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  display:block;
  filter: grayscale(1) contrast(1.05) brightness(0.98);
}
.cap{
  margin-top: 12px;
  line-height: 1.4;
  text-align:left;
  opacity: .7;
}

.cta{
  margin-top: 16px;
  display:flex;
  flex-direction:column;
  gap: 10px;
}
.cta a{
  width: fit-content;
}

@media (max-width: 920px){
  .museum{ grid-template-columns: 1fr; }
  .split{ grid-template-columns: 1fr; }
  .rightCol{ max-width: 520px; }
}
</style>
