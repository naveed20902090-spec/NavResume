import { onMounted, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'

export function useTheme(){
  const theme = useState<ThemeMode>('theme', () => 'light')

  function apply(mode: ThemeMode){
    theme.value = mode
    if (process.client){
      document.documentElement.setAttribute('data-theme', mode)
      try{ localStorage.setItem('theme', mode) } catch { /* ignore */ }
    }
  }

  function toggle(){
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => {
    if (!process.client) return
    const stored = (() => {
      try{ return localStorage.getItem('theme') as ThemeMode | null } catch { return null }
    })()
    if (stored === 'dark' || stored === 'light') apply(stored)
    else apply('light')
  })

  // Keep DOM in sync on SSR hydration updates
  watch(theme, (v) => {
    if (process.client) document.documentElement.setAttribute('data-theme', v)
  })

  return { theme, apply, toggle }
}
