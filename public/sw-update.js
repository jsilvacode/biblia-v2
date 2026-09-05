const replacesPreviousVersion = Boolean(self.registration.active)

self.addEventListener('activate', (event) => {
  if (!replacesPreviousVersion) return

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clients) => Promise.all(
        clients
          .filter((client) => client.url.startsWith(self.location.origin))
          .map((client) => client.navigate(client.url).catch(() => undefined)),
      )),
  )
})
