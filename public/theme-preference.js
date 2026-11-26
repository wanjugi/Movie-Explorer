(() => {
  const key = 'movieExplorer.theme'
  const resolve = value => value === 'light' ? 'light' : 'dark'
  const root = document.documentElement
  let saved
  try { saved = window.localStorage.getItem(key) } catch { /* use the default */ }
  root.dataset.theme = resolve(saved)
  window.movieExplorerTheme = Object.freeze({
    get value() { return root.dataset.theme },
    set(value) {
      const theme = resolve(value)
      root.dataset.theme = theme
      try { window.localStorage.setItem(key, theme) } catch { /* keep the session theme */ }
      return theme
    },
  })
})()
