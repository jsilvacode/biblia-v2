const replacesPreviousVersion = Boolean(self.registration.active)

self.addEventListener('activate', (event) => {
  if (!replacesPreviousVersion) return

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clients) => {
        // Each tab decides when to reload. Activation must never close a
        // reader's dialog, selection, search, or unfinished study answer.
        clients
          .filter((client) => client.url.startsWith(`${self.location.origin}/`))
          .forEach((client) => { client.postMessage({ type: 'SANTA_BIBLIA_UPDATE_AVAILABLE' }) })
      }),
  )
})
