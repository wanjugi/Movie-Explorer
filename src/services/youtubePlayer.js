let scriptPromise

export function loadYouTubePlayer() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const timeout = setTimeout(fail, 8000)
      function fail() {
        clearTimeout(timeout)
        script.remove()
        window.onYouTubeIframeAPIReady = undefined
        reject(new Error('YouTube could not load.'))
      }
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout)
        window.onYouTubeIframeAPIReady = undefined
        if (window.YT?.Player) resolve(window.YT)
        else fail()
      }
      script.src = 'https://www.youtube.com/iframe_api'
      script.addEventListener('error', fail, { once: true })
      document.head.append(script)
    }).catch(error => {
      scriptPromise = undefined
      throw error
    })
  }
  return scriptPromise
}
