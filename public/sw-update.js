const replacesPreviousVersion = Boolean(self.registration.active)

self.addEventListener('activate', (event) => {
  if (!replacesPreviousVersion) return

  event.waitUntil(
    // Control the navigation before asking existing tabs to reload; otherwise
    // the retiring worker can answer that reload with the previous HTML.
    self.clients.claim()
      .then(() => self.clients.matchAll({ includeUncontrolled: true, type: 'window' }))
      .then((clients) => {
        // The new navigation can wait for activation. Do not make activation
        // wait for that navigation in return (a circular wait).
        clients
          .filter((client) => client.url.startsWith(self.location.origin))
          .forEach((client) => { void client.navigate(client.url).catch(() => undefined) })
      }),
  )
})
