# Estado de ejecución — experiencias de lectura

Actualizado: 15 de septiembre de 2026. Encargo: [plan principal para Luna](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).

Actualización visual 14/09/2026: guía, mockups navegables, artes originales y capturas en [docs/design](../design/GUIA_VISUAL_LUNA_2026-09-10.md). Diseño preparado para revisión; las etapas de integración de la app continúan pendientes. Consultar el [reporte visual](../design/experiencias-lectura-v1/qa-report.json) para resultados de esta muestra, separados de las pruebas de la aplicación.

## Etapas 0A y 1 · primera tarjeta del Home

**Estado:** implementadas, verificadas e integradas en `main`. La base inicial registrada fue `1dbd071`; no había cambios locales que preservar. Se identificaron las claves locales existentes `santa_biblia_v2_reading` para historial/progreso y `santa_biblia_v2_settings` para tema, idioma y preferencias. La etapa no depende de flags ni de fuentes externas.

**Implementado:** la tarjeta posterior al Hero conserva su arte editorial y el Hero sin cambios. Con historial muestra “Tu momento con la Palabra”, la referencia guardada, “Retoma tu última lectura.” y las acciones iguales “Continuar leyendo” y “Elegir una lectura”. Sin historial muestra “Comenzar a leer”, la invitación a elegir libro/capítulo y una única acción centrada “Elegir una lectura”. Ambas rutas reutilizan el progreso y el selector compartido existentes. La acción principal usa azul grisáceo y la secundaria azul neblina, con una variante de contraste específica en modo oscuro.

**Verificado:**

- `npm run lint`: aprobado.
- `npm run test`: 123 pruebas aprobadas.
- `npm run build`: aprobado; índice, contenido del curso, contrato público y corpus auditados.
- `npm run test:e2e`: 77 pruebas aprobadas y 13 omitidas por proyecto de dispositivo no aplicable.
- Prueba añadida: 320, 390, 768 y 1440 px; claro/oscuro; con/sin historial; igualdad de acciones, centrado móvil, ausencia de recorte y texto ampliado. La apertura del selector se comprueba explícitamente a 320 px.
- `git diff --check`: sin errores antes del cierre.

**Evidencia durable:** [capturas iniciales y finales](evidence/etapa-1-home/README.md). Incluye matriz de 16 combinaciones regulares y cuatro capturas con texto ampliado, generadas por `scripts/capture-home-stage1.mjs`. Es emulación Chromium, no validación en hardware físico.

**Siguiente etapa concreta recomendada:** ejecutar 3A · Resolver audio. Mantenerla limitada a metadata, endpoint, caché/fallback y pruebas, sin construir todavía el reproductor ni la ruta inmersiva.

## Etapa 0B · cobertura de búsqueda bíblica

**Estado:** implementada, verificada y aprobada en la prueba local; integrada en `main` para producción.

**Implementado:** el motor de búsqueda ahora normaliza y compara palabras completas, exige todos los términos de una frase aunque estén separados y devuelve lotes de 50 con su total real. El worker, `SearchPage` y el selector `BibleNavigator` comparten ese contrato: muestran “50 de N resultados”, cargan el siguiente lote con “Ver más resultados” y conservan las rutas a referencias. Buscar actualiza sus resultados mientras se escribe, con el mismo retardo breve del selector y sin añadir una entrada de historial por letra. Al cambiar o borrar una consulta se invalidan las respuestas anteriores; al borrar el campo de Buscar se retira la consulta de la URL inmediatamente.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 126 pruebas aprobadas.
- `npm run build`: aprobado; índice, contenido del curso, contrato público y corpus auditados.
- Pruebas focalizadas de navegador: 13 aprobadas y 1 omitida por proyecto no aplicable. Cubren búsqueda en vivo sin Enter, referencias en vivo, más de 100 resultados, “mundo” sin “inmundo”, frase con términos separados, selector compartido y cambio/limpieza de consulta.
- Revisión manual automatizada en `/search`: “mundo” mostró `50 de 221 resultados` y la acción “Ver más resultados”.
- La pasada completa de navegador encontró una comprobación previa y ajena a 0B de restauración de scroll al volver al Home en móvil (`188 px` frente al umbral de `>200 px`). La búsqueda nueva aprobó en esa pasada. Se deja como corrección separada de navegación, sin ocultarla relajando la prueba.

**Prueba manual de cierre:** aprobada antes de integrar. Se confirmó que la búsqueda en `/search` muestra resultados mientras se escribe, conserva el selector compartido y permite cargar resultados adicionales.

## Etapa 2 · Arte e identidad

**Estado:** implementada, verificada y aprobada en la revisión local; integrada en `main` para producción.

**Implementado:** las tarjetas existentes de Reavivados por su Palabra y La Fe de Jesús usan ahora los WebP originales preparados para esta experiencia. Reavivados combina cielo, amanecer, pradera y Biblia abierta con un velo azul local; el curso combina azul/lila, la figura acogedora y un velo que deja la copia HTML legible. Sus textos, iconos, foco, flecha y progreso reciben contraste propio en claro y oscuro, sin modificar tokens globales, Hero, guía temática, rutas, contenido ni estado de progreso. Reavivados mantiene de forma deliberada el lector bíblico actual; su ruta inmersiva es la etapa 3C. La Fe de Jesús mantiene `/studies/la-fe-de-jesus`; su índice propio pertenece a 5A.

**Assets y procedencia:** `public/assets/home-rpsp-landscape-v1.webp` y `public/assets/home-study-invitation-v1.webp` son copias byte a byte de los WebP originales documentados en `docs/design/experiencias-lectura-v1/assets/`, con sus prompts y maestros conservados allí. Pesan 85 KB y 86 KB, dentro del presupuesto de 180 KB por tarjeta. Se retiraron los dos fondos editoriales reemplazados para no aumentar el precache con imágenes sin uso.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run build`: aprobado; índice, contenido del curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/home-reading-flow.spec.js`: 16 aprobadas.
- Navegación desde Home: 2 pruebas aprobadas para el curso y 2 para Reavivados/temas; los destinos previos permanecen intactos.
- [Capturas responsive](evidence/etapa-2-arte/README.md): 320, 390, 768 y 1440 px, claro/oscuro, con/sin historial, texto ampliado y movimiento reducido. Se comprobó que el libro de Reavivados se conserva en el tercio derecho y que el texto del curso no cubre rostro ni manos en móvil.
- `git diff --check`: sin errores.

**Prueba manual de cierre:** aprobada. Se confirmó el recorte de la Biblia y de la figura, el velo más corto y la interpretación azul petróleo/índigo propia del modo noche, junto con los destinos actuales de ambas tarjetas.

## Etapa 3A · Fuente de audio de Reavivados

**Estado:** implementada y verificada localmente en `mejoras/fuente-audio-reavivados`; queda pendiente la revisión local del usuario y su integración en `main`. Esta etapa no crea todavía reproductor, ruta inmersiva ni cambios de interfaz.

**Implementado:** `GET /api/rpsp?date=YYYY-MM-DD` valida fechas civiles estrictas y resuelve la referencia desde el calendario instalado, sin convertirla por UTC ni aceptar URLs externas. Consume el RSS oficial con límite de 1 MB, timeout de seis segundos, presupuesto total de doce, ETag/Last-Modified, deduplicación en proceso y coincidencia exacta de fecha, libro y capítulo. No confunde, por ejemplo, Salmo 134 con Salmo 34.

Cuando el RSS no contiene la entrada, consulta de forma acotada la API oficial de WordPress y su página canónica para extraer sólo un `<audio>` o `<source>` de `vod.nuevotiempo.org`. Los redireccionamientos, la página y el medio se validan contra hosts HTTPS conocidos. Ante fallos de fuente, usa únicamente un snapshot documentado de igual fecha y referencia; nunca entrega el audio previo. La respuesta distingue `ready`, `pending`, `unavailable` y `out_of_calendar`; sólo metadata tiene caché larga. El MP3 no se descarga, reenvía, almacena ni precachea.

**Integración local:** Vite sirve el mismo handler Request→Response para desarrollo y preview; Vercel recibe función, exclusiones de corpus y rewrite explícito antes del fallback SPA. El repositorio de navegador valida el contrato, comparte una solicitud por fecha y permite cancelar un consumidor sin interrumpir la petición compartida.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 142 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/home-reading-flow.spec.js`: 16 pruebas aprobadas.
- `GET /api/rpsp?date=2026-09-10` en preview local: Salmos 34 y snapshot exacto si los proveedores agotan el tiempo.
- `GET /api/rpsp?date=2026-09-11` en preview local: `unavailable`, sin reutilizar el MP3 del 10.
- `git diff --check`: sin errores antes de la revisión.

**Evidencia durable:** [metadata, pruebas y límites de alcance](evidence/etapa-3a-audio/README.md). La fuente y la procedencia del snapshot se documentan en [SOURCES_AUDIO_RPSP.md](SOURCES_AUDIO_RPSP.md). La reproducción real sigue pendiente para 3B/3C.

**Siguiente paso tras integrar 3A:** 3B · Reproductor, limitado a un `HTMLAudioElement` directo y sus controles accesibles. La ruta inmersiva de Reavivados continúa en 3C.

## Base anterior a las nuevas etapas

La base incorpora acceso desde Home, selector compartido, búsqueda integrada, navegación del lector, retirada de espera artificial de arranque y footer con color/espaciado. No equivale al rediseño nuevo solicitado.

Validación completada sobre esa base:

- `npm run lint`: aprobado.
- `npm run test`: 123 pruebas aprobadas.
- Compilación Vite y auditoría de contrato público: aprobadas.
- `npm run audit:text-corpus`: aprobado; 4820 archivos y 319981 entradas.
- `npm run test:e2e`: 73 aprobadas, 13 omitidas. Se corrigió un selector de prueba que dependía del nombre accesible antiguo del buscador; se repitió la suite completa y terminó sin fallos.
- `git diff --check`: sin errores.

Base guardada y subida a `origin/main` en el commit [`4617e65`](https://github.com/jsilvacode/biblia-v2/commit/4617e65). La subida a GitHub se completó; no se ha verificado el despliegue de producción. Luna debe registrar también el commit del checkout que recibe, que incluirá este plan.

## Nuevas etapas

| Etapa | Estado | Próxima salida |
|---|---|---|
| 0A · Base para Luna | Completada | Base `1dbd071`, fuentes/estado local identificados y capturas iniciales guardadas. |
| 0B · Cobertura de búsqueda | Completada e integrada | Palabras completas, total real, paginación, búsqueda en vivo y descarte de resultados anteriores. |
| 1 · Primera tarjeta | Completada | Centrado móvil, tonos azules suaves y estados con/sin historial validados. |
| 2 · Arte | Completada e integrada | WebP originales, variante nocturna y evidencia responsive; rutas y progreso conservados. |
| 3A · Fuente de audio | Implementada localmente; pendiente de revisión e integración | Endpoint RSS/WordPress, caché, snapshot exacto y repositorio validados. |
| 3B · Reproductor | Pendiente | Player directo y pruebas reales de reproducción. |
| 3C · Reavivados | Pendiente | Ruta inmersiva del día. |
| 4A / 4B · Temas | Planificados | Explorador y ficha de situación. |
| 5A / 5B · Curso | Planificados | Índice y lección con identidad propia. |
| 6A · Fuente de libros | Investigación completada; fuente interna sin cerrar | Edición apta o catálogo de enlaces oficiales. |
| 6B / 6C · Libros internos | Dependientes de fuente por título | Texto íntegro y lector separado. |
| 7 · Integración nueva | Pendiente | QA conjunta y estado de publicación. |

## Formato de actualización por etapa

Añadir fecha, etapa, commit, archivos, comportamiento entregado, pruebas con resultado, ubicación durable de capturas y pendientes concretos. Distinguir implementación, verificación y publicación. Una prueba con red simulada no sustituye reproducción real; un enlace externo no completa el lector interno.
