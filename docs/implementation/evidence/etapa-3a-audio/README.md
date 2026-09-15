# Evidencia — etapa 3A · fuente de audio

Fecha de ejecución: 15 de septiembre de 2026. Esta evidencia comprueba metadata y rutas locales; no acredita todavía la reproducción en Safari, Android ni la interfaz del reproductor.

## Contrato local

Con `npm run preview -- --host 127.0.0.1 --port 4178`, la petición `GET /api/rpsp?date=2026-09-10` devolvió JSON con:

- `reference: { book: 19, chapter: 34 }`;
- `status: "ready"` y caché positiva `s-maxage=900, stale-while-revalidate=3600`;
- el episodio oficial `38751`, su página de Nuevo Tiempo y el MP3 directo de `vod.nuevotiempo.org`;
- `provenance: "snapshot"`, porque la consulta remota agotó el presupuesto durante esa ejecución.

El servidor Vite de trabajo en `4176` resolvió después el mismo episodio mediante `provenance: "wordpress"`. Ambos caminos conservan la misma fecha, referencia, página y URL directa del medio; el proveedor puede responder con distinta latencia.

La misma comprobación para `2026-09-11` devolvió `reference: { book: 19, chapter: 35 }`, `status: "unavailable"`, `episode: null` y caché corta de 120 segundos. Confirma que el snapshot de Salmos 34 no se reutiliza como audio de otro día.

## Verificaciones automatizadas

- `npm run lint`: aprobado.
- `npm run test`: 142 pruebas aprobadas.
- `npm run build`: aprobado, con auditorías de contrato público y corpus.
- `npm run test:e2e -- e2e/home-reading-flow.spec.js`: 16 pruebas aprobadas; el middleware nuevo deja intactas las rutas existentes.
- Pruebas nuevas: fechas civiles, coincidencia exacta de libro/capítulo, rechazo de host/redirección no verificados, ETag, RSS, WordPress, snapshot de fecha exacta, errores y repositorio abortable.

Los fixtures contienen sólo metadata mínima y URLs públicas. No descargan, proxifican ni empaquetan el MP3.
