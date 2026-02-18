export type ProjectCaseStudy = {
  goal: string
  approach: string
  editingDecisions: string[]
  improved: string[]
}

export type Project = {
  id: string
  title: string
  desc: string
  youtubeId: string
  link: string
  badge: string
  category: string
  tags: string[]
  metaLine: string
  madeFor: string
  appsUsed: string[]
  deliverables: string[]
  caseStudy: ProjectCaseStudy
  media: {
    src: string
    alt: string
  }
  /**
   * Featured projects appear in the "Best" view used for quick client scanning.
   * Lower rank = higher priority. Omit for non-featured.
   */
  featuredRank?: number
}

export const projects: Project[] = [
  {
    id: 'showreel',
    featuredRank: 2,
    title: 'SHOWREEL',
    desc: 'A curated gaming montage reel — story-led pacing, music sync, and layered sound design built for replay value.',
    youtubeId: '6k_Esgfw57k',
    link: 'https://youtu.be/6k_Esgfw57k',
    badge: 'GAMING MONTAGE',
    category: 'Showreel',
    tags: ['PACING', 'MUSIC SYNC', 'SOUND DESIGN'],
    metaLine: 'NARRATIVE RHYTHM • MUSIC LOCK • SONIC DETAIL',
    madeFor: 'Personal portfolio (capability reel)',
    appsUsed: ['Adobe Premiere Pro', 'After Effects (as needed)', 'Audition / DAW (sound + mix)'],
    deliverables: ['YouTube master export', 'Short-form cutdowns (optional)'],
    caseStudy: {
      goal: 'Show range and taste — pacing, emotional structure, and sound-led transitions that feel cinematic.',
      approach: 'Keep it lean. Let the music set the grid, then use sound layers to control impact and continuity.',
      editingDecisions: [
        'Beat-led cuts (music + SFX lock)',
        'Controlled dynamics: quiet moments before major hits',
        'Clean J/L cuts to carry momentum through transitions'
      ],
      improved: [
        'Stronger perceived production value through sound',
        'Clearer story beats despite fast pacing',
        'More consistent rhythm across sections'
      ]
    },
    media: { src: 'https://i.ytimg.com/vi/6k_Esgfw57k/hqdefault.jpg', alt: 'Showreel frame' }
  },

  {
    id: 'client-montage',
    featuredRank: 1,
    title: 'CLIENT MONTAGE',
    desc: 'Client gaming montage built around a clear brief: high-impact pacing, clean structure, and a polished grade + mix.',
    youtubeId: 'jD5L_jbf3To',
    link: 'https://youtu.be/jD5L_jbf3To',
    badge: 'CLIENT WORK',
    category: 'Gaming montage',
    tags: ['IMPACT CUTS', 'GRADE + MIX', 'SFX LAYERS'],
    metaLine: 'CLIENT BRIEF • IMPACT CUTS • GRADE + MIX',
    madeFor: 'Gaming client / creator (commissioned montage)',
    appsUsed: ['Adobe Premiere Pro', 'After Effects (as needed)', 'Audition / DAW (sound + mix)'],
    deliverables: ['YouTube master export', 'Social cutdowns (optional)'],
    caseStudy: {
      goal: 'Deliver a premium montage that feels controlled and intentional — not noisy — while keeping intensity high.',
      approach: 'Build a clear arc (setup → escalation → release), then reinforce the story with a tight mix and purposeful accents.',
      editingDecisions: [
        'Music-first structure (beats define sections)',
        'Micro-ramping for emphasis without distortion',
        'Selective FX + motion only where it improves readability'
      ],
      improved: [
        'Cleaner pacing for retention',
        'More professional loudness and clarity for social playback',
        'Stronger visual hierarchy under fast motion'
      ]
    },
    media: { src: 'https://i.ytimg.com/vi/jD5L_jbf3To/hqdefault.jpg', alt: 'Client montage frame' }
  },

  {
    id: 'cascade',
    featuredRank: 3,
    title: 'DESIGN PROJECT: CASCADE (ROYAL JOHOR MUSEUM)',
    desc: 'Architectural showcase for the Royal Johor Museum — cinematic reveals, controlled pacing, and music-synced sound design that elevates the space.',
    youtubeId: 'D6hvPAyYvgo',
    link: 'https://youtu.be/D6hvPAyYvgo',
    badge: 'DESIGN FILM',
    category: 'Architectural showcase',
    tags: ['ARCHITECTURE', 'MUSIC SYNC', 'SOUND DESIGN'],
    metaLine: 'DESIGN REVEALS • MUSIC SYNC • SONIC ATMOSPHERE',
    madeFor: 'Architect / design showcase',
    appsUsed: ['Adobe Premiere Pro', 'After Effects (titles / polish)', 'Audition / DAW (mix + dynamics)'],
    deliverables: ['YouTube master export', 'Website-ready version'],
    caseStudy: {
      goal: 'Make the project feel like a gallery experience: intentional pacing, clean presentation, and premium sound.',
      approach: 'Treat the edit like a guided walk—hold shots long enough to feel deliberate, then use sound to connect spaces.',
      editingDecisions: [
        'Subtle ambience + room tone to add depth',
        'Hard sync on key reveals and camera motion',
        'Minimalist typography to keep credibility'
      ],
      improved: [
        'Higher perceived quality through mix + dynamics',
        'Clearer storytelling of the space and details',
        'Smoother transitions that feel motivated'
      ]
    },
    media: { src: 'https://i.ytimg.com/vi/D6hvPAyYvgo/hqdefault.jpg', alt: 'Cascade project frame' }
  },

  {
    id: 'rendezvous',
    title: 'Rendezvous — School of Music',
    desc: 'Architectural showcase for a School of Music — rhythm-led pacing, detail-driven reveals, and sound-led transitions synced to the score.',
    youtubeId: 'kdcYxsr1mpQ',
    link: 'https://youtu.be/kdcYxsr1mpQ',
    badge: 'DESIGN FILM',
    category: 'Architectural showcase',
    tags: ['ATMOSPHERE', 'RHYTHM', 'SOUND-LED CUTS'],
    metaLine: 'ATMOSPHERE • RHYTHM • SOUND-LED TRANSITIONS',
    madeFor: 'Architect / design showcase',
    appsUsed: ['Adobe Premiere Pro', 'After Effects (micro-titles)', 'Audition / DAW (sound + mix)'],
    deliverables: ['YouTube master export', 'Short social teaser (optional)'],
    caseStudy: {
      goal: 'Translate a space into feeling: rhythm, atmosphere, and detail that communicates craft.',
      approach: 'Cut like a trailer with restraint—let the music shape the pace, then weave sound to make transitions feel natural.',
      editingDecisions: [
        'Textural foley layers (subtle, not literal)',
        'Beat accents aligned to camera movement',
        'Consistent tonal grade for cohesion'
      ],
      improved: [
        'More cinematic continuity between shots',
        'Stronger emphasis on materials and details',
        'More premium, intentional pacing for portfolio viewing'
      ]
    },
    media: { src: 'https://i.ytimg.com/vi/kdcYxsr1mpQ/hqdefault.jpg', alt: 'Rendezvous project frame' }
  }
]

export function useProjects(){
  return { projects }
}
