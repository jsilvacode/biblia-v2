# Estado de ejecución — experiencias de lectura

Actualizado: 16 de septiembre de 2026. Encargo: [plan principal para Luna](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).

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

**Registro histórico:** la siguiente etapa de esta base fue 3A · Resolver audio; quedó integrada posteriormente en `main` como se describe abajo.

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

**Estado:** implementada, verificada e integrada en `main` mediante `6e6f1ca` (**Resuelve la fuente de audio de Reavivados**). Esta etapa no creó reproductor, ruta inmersiva ni cambios de interfaz.

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

**Ajuste local posterior a la integración:** la fuente oficial respondió lentamente el 15/09/2026. La rama `mejoras/experiencia-reavivados` prioriza WordPress, concede hasta 12 segundos a cada una de las dos consultas oficiales necesarias y amplía el presupuesto total a 28 segundos; RSS queda como respaldo. En `http://127.0.0.1:4179/api/rpsp?date=2026-09-15` resolvió Salmos 39 con metadata exacta y procedencia `wordpress` en 12,26 segundos. Mantiene la regla de 3A: sólo entrega metadata y nunca descarga, proxifica ni precachea el MP3.

**Siguiente paso tras integrar 3A:** 3B · Reproductor, limitado a un `HTMLAudioElement` directo y sus controles accesibles. La ruta inmersiva de Reavivados continúa en 3C.

## Etapa 3B · Reproductor de Reavivados

**Estado:** implementada, verificada e integrada en `main` junto con 3C mediante `94b5453` (**Crea experiencia diaria de Reavivados**).

**Implementado:** `DailyAudioPlayer` contiene un único `HTMLAudioElement` con `preload="none"` y sin `src` hasta que la persona pulsa reproducir. Reacciona a los eventos reales del medio, no muestra pausa antes de `playing`, muestra duración desconocida como `—:—`, permite pausar, buscar con slider accesible, avanzar/retroceder 15 segundos, controlar volumen y activar bucle. La tarjeta muestra en dos líneas el título normalizado de la reflexión y su referencia bíblica; los tiempos quedan a ambos lados de su línea de progreso.

El vínculo verificable “Ver fuente” permanece fuera del reproductor. El control queda deliberadamente bajo: título de dos líneas, una fila equilibrada con play protagonista, volumen desplegable hacia arriba y línea de tiempo compacta. Los cambios de estado normales no añaden mensajes bajo la línea de tiempo, para que el encabezado de la lectura y sus primeros versículos entren antes en la pantalla móvil.

El componente diferencia metadata pendiente, disponible, sin audio y fuera de calendario; maneja rechazo de `play()`, error recuperable y reintento. Al desmontar pausa y elimina la fuente. Si llega un episodio nuevo mientras existe una sesión activa, mantiene el audio actual y presenta “Ya está disponible la lectura de hoy” con una acción explícita para cambiar; no sustituye el MP3 a mitad de escucha.

**Alcance deliberado:** 3B aporta sólo el reproductor. La integración visual, el capítulo diario, la navegación y el progreso independiente se describen en 3C. El código no descarga, proxifica, convierte a blob, reenvía ni precachea el audio.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 149 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/home-reading-flow.spec.js`: 16 pruebas aprobadas.
- Pruebas del componente: reproducción confirmada, pausa, buffering, seek, finalización, error, reintento, cambio de día y limpieza de fuente.
- `git diff --check`: sin errores antes de la revisión.

**Evidencia durable:** [cobertura y límites de 3B](evidence/etapa-3b-player/README.md). Safari/iOS y Android/Chrome quedan como prueba manual de 3C, cuando el player sea alcanzable desde la experiencia inmersiva.

## Etapa 3C · Experiencia diaria de Reavivados

**Estado:** implementada, verificada e integrada en `main` junto con 3B mediante `94b5453` (**Crea experiencia diaria de Reavivados**). La validación física del audio directo depende todavía de que Nuevo Tiempo permita el medio publicado.

**Implementado:** `/reavivados` resuelve el día civil local, conserva el encabezado, navegación móvil de cuatro destinos y footer globales, y concentra el contenido en el paisaje de Reavivados, un reproductor único y el capítulo bíblico del día. La tarjeta de Home ya apunta a esta ruta; `/plans` conserva su función de calendario secundario.

El bloque editorial “Reflexión del día” se separa del control de audio y conserva “Ver fuente” fuera de él. El player concentra el título de la reflexión y la referencia bíblica, sin una atribución fija que no provenga del episodio. Así, el control no se convierte en una segunda tarjeta de contenido ni desplaza la lectura inicial fuera del primer viewport de 390 px. En móvil, Reavivados comparte el auto-ocultamiento y la transición suave del lector: la barra reaparece con un gesto o scroll y queda visible al alcanzar el final del contenido.

El capítulo utiliza la versión bíblica y escala de texto elegidas. Carga y reintenta en forma independiente de la metadata/audio: sin reflexión, la lectura sigue disponible. No añade selector, siguiente capítulo, lista de episodios, notas, guardados ni sugerencias dentro de la cápsula. El capítulo y episodio en curso se mantienen al cambiar el día durante una sesión de audio; la persona ve una acción explícita para abrir la lectura del nuevo día.

El progreso de esta experiencia se guarda únicamente en `santa_biblia_v2_rpsp`, con fecha civil, referencia, versículo, porcentaje de scroll y posición de audio. Entrar a Reavivados siempre conserva el encabezado en pantalla: el progreso no desplaza automáticamente la nueva visita. El estado de lectura libre de Home no se modifica. Si el progreso pertenece al capítulo de hoy, la tarjeta de Reavivados muestra “Retomar la lectura de hoy”.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 152 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/reavivados.spec.js e2e/reading-flow.spec.js`: las pruebas relevantes aprobaron en móvil y escritorio, con metadata interceptada y determinista. Cubren la entrada desde el encabezado aun con progreso guardado y que la navegación inferior del lector siga visible al final; su ocultamiento y transición durante la lectura no se modifican.
- El flujo de navegador comprueba el enlace Home → `/reavivados`, un único reproductor sin `src` inicial, reproducción iniciada por gesto, una sola navegación global, footer, lectura disponible sin audio y fallo/reintento independiente del capítulo.
- `npm run test:e2e` completo: 86 aprobadas y 13 omitidas por proyecto no aplicable. Persiste una sola comprobación histórica ajena a esta entrega: restauración de scroll de Home en móvil obtuvo `188 px` frente al umbral de `>200 px`, ya registrada en 0B; Reavivados y Home actualizado aprobaron.
- `git diff --check`: aprobado durante la implementación.

**Evidencia durable:** [capturas y alcance de 3C](evidence/etapa-3c-reavivados/README.md). Incluye 320, 390, 768 y 1440 px, claro/oscuro y texto ampliado, con metadata simulada del capítulo correcto. La reproducción real con gesto en Safari/iOS y Chrome/Android sigue siendo la prueba manual externa pendiente.

**Observación de fuente en la revisión local:** la URL directa que el propio episodio oficial publica para Salmos 39 (`vod.nuevotiempo.org`) devolvió `403 Forbidden` tanto a una solicitud de rango de un byte como al control del navegador observado en esta revisión. La app no la reemplaza ni la proxifica: muestra el enlace “Ver fuente”, deja el capítulo disponible y comunica que la fuente no permitió cargar el audio. La metadata ya se resuelve; la disponibilidad real del archivo sigue siendo una dependencia de Nuevo Tiempo que debe comprobarse de nuevo antes de integrar.

**Siguiente paso tras integrar 3B/3C:** 4A · nueva navegación de la guía temática.

## Etapa 4B · Ficha temática

**Estado:** completada e integrada en `main` mediante `7791640` (**Crea fichas para la guía temática**).

**Implementado:** cada tarjeta del índice ahora abre `/topics/:categoryId/:situationId` y conserva los filtros `q` y `category` de la guía. La ficha muestra de inmediato sólo el pasaje central y ofrece hasta cinco complementarias por enlaces estables `?reading=companion-N`; sin ese parámetro no se carga ninguna lectura secundaria. Elegir una complementaria conserva la URL compartible y carga sólo ese pasaje.

“Volver a la guía” mantiene la consulta y el área, y la posición del índice se restaura al retornar. “Leer en el lector” pasa el retorno exacto con ficha, parámetros y complementaria activa; el lector regresa a ese punto sin cambiar su navegación. En móvil, la ficha adopta la inmersión ya usada por el lector y Reavivados: la navegación inferior se desvanece sólo durante una pausa de lectura, se revela con gesto o scroll y queda fija al llegar al final. Los enlaces previos del tipo `?category=…#topic-…` se resuelven comparando IDs editoriales completos, incluso con guiones, y llevan a la ficha equivalente. Una situación inexistente muestra una salida clara hacia la guía.

**Datos y límites:** se conservan los 92 IDs, títulos, orden, central y complementarias de `topics.es.json`; no se añadió contenido doctrinal ni se alteró `TopicPassage`, por lo que las lecciones del curso continúan usando su estilo y retorno actual.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 160 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/topics-explorer.spec.js e2e/topic-detail.spec.js e2e/mobile-navigation.spec.js`: cubre índice, ficha, complementaria bajo demanda, lector y retorno, rutas antiguas, ficha inexistente, inmersión móvil, texto ampliado, 320/390 px y dos columnas desde 768 px.
- `git diff --check`: aprobado.

**Evidencia durable:** [capturas responsive de la ficha](evidence/etapa-4b-ficha-tematica/README.md). Incluye claro/oscuro, 320/390/768/1440 px y texto ampliado; se complementa con las pruebas de interacción porque la captura sólo representa el estado editorial inicial sin complementaria cargada.

**Siguiente paso tras integrar:** 5A · índice del curso.

## Etapa 4A · Índice de la guía temática

**Estado:** completada e integrada en `main` mediante `2872641` (**Mejora la guía temática y el audio de Reavivados**).

**Implementado:** `/topics` ya no exige escoger un área antes de mostrar contenido. Parte con doce de las 92 situaciones, en el orden editorial del catálogo, y permite ampliar el listado sin ocultar que existen más resultados. El buscador actualiza la URL con reemplazo de historial y compara todos los términos normalizados de título, área y referencias; entiende acentos y referencias con o sin espacios o signos.

En escritorio las 13 áreas son una columna lateral fija y los resultados aparecen en dos columnas. En móvil sólo se desplaza horizontalmente la fila de filtros; “Ver áreas” revela el panel completo y el listado de tarjetas conserva una sola columna legible. Las categorías siguen siendo filtros combinables con la consulta mediante `?category` y `?q`. Cada tarjeta expone área, situación y lectura central, conserva el despliegue bajo demanda de la lectura existente y no carga pasajes de las 92 situaciones al abrir el índice.

**Alcance deliberado:** la ficha con ruta propia, pasaje central y complementarias es la etapa 4B. Mientras se desarrolla, el despliegue actual preserva un destino de lectura funcional para cada tarjeta.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test -- src/features/topics/topicSearch.test.js src/i18n/locales/locales.test.js`: 6 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/topics-explorer.spec.js`: 7 aprobadas y 3 omitidas por proyecto no aplicable. Cubre las 92 entradas, 12 iniciales, búsqueda en vivo normalizada, filtros URL combinables, panel de 13 áreas, ausencia de desborde a 320 px, texto ampliado y dos columnas desde 768 px.
- `git diff --check`: aprobado.

**Evidencia durable:** [capturas responsive](evidence/etapa-4a-guia-tematica/README.md) a 320, 390, 768 y 1440 px, claro/oscuro y texto ampliado. La pasada conjunta de navegación conserva una comprobación histórica ajena a esta entrega: restauración de scroll de Home en móvil obtuvo `188 px` frente al umbral de `>200 px`.

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
| 3A · Fuente de audio | Completada e integrada | Endpoint RSS/WordPress, caché, snapshot exacto y repositorio validados en `6e6f1ca`. |
| 3B · Reproductor | Completada e integrada | Player directo, controles, estados y seguridad de sesión. |
| 3C · Reavivados | Completada e integrada | Ruta inmersiva, capítulo independiente, progreso separado y evidencia responsive. |
| 4A · Índice de temas | Completada e integrada | Explorador, búsqueda, filtros URL y 92 situaciones accesibles. |
| 4B · Ficha temática | Completada e integrada | Ruta propia, pasaje central, complementarias bajo demanda e inmersión móvil. |
| 5A / 5B · Curso | Planificados | Índice y lección con identidad propia. |
| 6A · Fuente de libros | Investigación completada; fuente interna sin cerrar | Edición apta o catálogo de enlaces oficiales. |
| 6B / 6C · Libros internos | Dependientes de fuente por título | Texto íntegro y lector separado. |
| 7 · Integración nueva | Pendiente | QA conjunta y estado de publicación. |

## Formato de actualización por etapa

Añadir fecha, etapa, commit, archivos, comportamiento entregado, pruebas con resultado, ubicación durable de capturas y pendientes concretos. Distinguir implementación, verificación y publicación. Una prueba con red simulada no sustituye reproducción real; un enlace externo no completa el lector interno.
