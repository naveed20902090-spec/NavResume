# michaelbardou-clone (Nuxt 3)

This is a **layout + interaction clone** of michaelbardou.com based on publicly available screenshots and the site's stated tech stack (Nuxt + GSAP + Three.js).

Important: achieving **pixel-perfect** fidelity requires:
- the **exact font files** used on the original site,
- the **original media assets** (project thumbnails / videos),
- and (ideally) access to the site’s CSS variables and breakpoints.

## Run

```bash
npm i
npm run dev
```

## Replace assets

Put images in `public/projects/`:
- `atsxy.jpg`
- `p02.jpg`
- `p03.jpg`

## Where to adjust for pixel-perfect matching

- `assets/css/main.css` (frame padding, top/bottom bands, typography)
- `components/HeaderNav.vue` / `FooterNav.vue` (spacing)
- `components/ArcNav.vue` (arc radii + label positions)
- `components/ProjectStage.vue` (media size + meta grid + GSAP timings)


## Content source
Populated using data extracted from your provided resume site (`Resume Website/index.html`).
