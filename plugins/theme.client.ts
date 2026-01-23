export default defineNuxtPlugin(() => {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      // Default: dark mode (requested)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})
