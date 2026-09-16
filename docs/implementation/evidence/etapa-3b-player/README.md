# Evidencia — etapa 3B · reproductor de Reavivados

Fecha de ejecución: 15 de septiembre de 2026. Esta etapa entrega el componente aislado; no añade una ruta de producto ni reproduce el MP3 durante el build.

## Cobertura del componente

`DailyAudioPlayer.test.jsx` valida en un navegador simulado:

- un único `HTMLAudioElement` sin `src` inicial y con `preload="none"`;
- duración desconocida como `—:—`, reproducción sólo tras la acción de la persona y cambio visual a pausa únicamente después de `playing`;
- eventos `loadedmetadata`, `waiting`, `playing`, `pause`, `seeking`, `seeked`, `timeupdate`, `ended` y `error`;
- avance o retroceso de 15 segundos, slider accesible y velocidades 1×, 1.25× y 1.5×;
- rechazo de `play()`, ausencia de metadata, reintento y liberación de la fuente al desmontar;
- llegada de un episodio nuevo durante una escucha: mantiene el episodio activo y exige la acción visible “Cambiar a la lectura de hoy”.

## Límites confirmados

No hay `fetch` del MP3, `crossOrigin`, blob, proxy, descarga ni precache. La prueba de reproducción real con gesto en Safari/iOS y Chrome/Android queda para 3C, cuando el componente tenga la ruta inmersiva donde pueda probarse sin introducir una pantalla temporal en la aplicación.

La cabecera editorial y el enlace de fuente no pertenecen al componente: los entrega la ruta inmersiva. Esto permite que el control conserve una altura baja y reutilizable, sin duplicar títulos ni ocultar el comienzo del capítulo en móvil.

## Comprobaciones

- `npm run lint`: aprobado.
- `npm run test`: 149 pruebas aprobadas.
- `npm run build`: aprobado con auditorías de contrato público y corpus.
- `npm run test:e2e -- e2e/home-reading-flow.spec.js`: 16 pruebas aprobadas; los iconos nuevos no alteran los flujos existentes.
