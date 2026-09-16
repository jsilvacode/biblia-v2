# Evidencia — etapa 3C · experiencia diaria de Reavivados

La evidencia visual se genera con `node scripts/capture-reavivados-stage3c.mjs`. El script intercepta `GET /api/rpsp` con metadata determinista del mismo capítulo que corresponda al día civil solicitado: no consulta Nuevo Tiempo, no descarga el MP3 y no toma un audio de otro día.

Las capturas de `final/` cubren 320, 390, 768 y 1440 px, claro y oscuro, además de 390 px con texto ampliado en ambos temas. Muestran la identidad de la reflexión y “Ver fuente” fuera del control compacto; a 390 px ya aparece el inicio del capítulo. Son capturas de Chromium para comparar composición y no reemplazan la reproducción física en Safari/iOS y Chrome/Android.

Las pruebas de navegador de `e2e/reavivados.spec.js` validan la misma ruta, el único reproductor, la ausencia de doble navegación, el footer global, el capítulo disponible sin audio y su fallo/reintento independiente.

El 15/09/2026 la consulta local real `GET /api/rpsp?date=2026-09-15` resolvió Salmos 39 con metadata oficial. El servidor de audio oficial respondió `403 Forbidden` a la reproducción directa durante esta revisión; la aplicación no descarga ni elude esa restricción y conserva el enlace de la fuente como salida visible.
