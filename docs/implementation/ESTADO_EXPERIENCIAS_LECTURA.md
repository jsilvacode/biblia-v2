# Estado de ejecución — experiencias de lectura

Actualizado: 12 de octubre de 2026. Encargo: [plan principal para Luna](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).

Actualización visual 14/09/2026: guía, mockups navegables, artes originales y capturas en [docs/design](../design/GUIA_VISUAL_LUNA_2026-09-10.md). Diseño preparado para revisión; las etapas de integración de la app continúan pendientes. Consultar el [reporte visual](../design/experiencias-lectura-v1/qa-report.json) para resultados de esta muestra, separados de las pruebas de la aplicación.

## Renovación del Home · 12/10/2026

**Estado:** publicada en `origin/main` mediante `62f2eeb`. Vercel confirmó `READY`, entorno de producción, fuente GitHub `main` y el mismo SHA; `www.santabiblia.cloud` entrega el nuevo bundle. Ocho comprobaciones sobre el dominio público aprobaron, incluidas imágenes, selector, capítulo y ambos temas.

**Entregado:** hero con paisaje continuo y velo localizado bajo la promesa; acceso bíblico centrado, sin selección inicial; última lectura real con enlace directo. El manto de vidrio se extiende detrás del selector y los tres artículos y se desvanece sin borde inferior. Las imágenes de los artículos son panorámicas, los títulos conservan el acento de cada tema y el hover es discreto, con respeto por movimiento reducido. Los cuatro enlaces externos originales se presentan en fichas compactas con iconos locales.

**Selector:** libro y capítulo usan desplegables de vidrio unidos al campo, con apertura automática arriba/abajo, máximo común de 288 px y reducción según el espacio del viewport y la navegación móvil. Conserva desplazamiento interno, teclado, búsqueda por escritura, foco y cierre exterior; cambiar libro restablece el capítulo. La promesa, versión bíblica, historial, progreso de Reavivados y curso siguen usando sus datos y rutas reales.

**Archivos:** `HomePage`, nuevo `HomePassagePicker`, variante de cabecera/footer del Home, traducciones ES/EN/PT, cuatro iconos externos y dos specs E2E adaptadas al nuevo acceso inline.

**Verificado:** lint; 164 unitarios en 37 archivos; build con auditoría del contrato público y corpus; `git diff --check`. La regresión general se complementó con la pasada final de Home/navegación: 38 casos aplicables aprobados y 8 omisiones previstas. Las tres imágenes editoriales también se cargan y decodifican en ambos proyectos E2E. Revisión visual de 24 combinaciones con/sin historial, tres idiomas, ambos temas y anchos de 320 a 1440 px, sin desborde y con siete imágenes cargadas por diseño. Gestos táctiles, apertura en ambas direcciones, límites y limpieza de listeners del selector comprobados en Chromium.

**Evidencia:** [capturas, resultados y alcance](evidence/home-editorial-2026-10-12/README.md). Es emulación Chromium; no representa una prueba física en Safari/iOS ni modifica la disponibilidad del audio de Nuevo Tiempo.

### Corrección de fidelidad con la maqueta · 12/10/2026

La revisión del usuario detectó pérdida de detalles visuales al integrar. Se recuperan `BookOpen` para Biblia y `Settings2` para Ajustes, trazo 1.6 sin compensación absoluta, tamaños/espaciado y tipografía comunes de la cabecera. La variante de páginas deja de usar la marca pequeña en negrita y los enlaces antiguos. Site y lector comparten vidrio también en móvil; se preservan los controles funcionales y la inmersión del lector. El manto sigue visible al reducir transparencia y recupera reflejos más perceptibles. Se iguala además el velo nocturno de tablet con el gradiente de la maqueta.

La ampliación pedida por el usuario lleva el manto a todo el ancho de los tres artículos en desktop y reorganiza también el lector mediante la barra común: Volver/marca a la izquierda, navegación centrada, tema/opciones a la derecha. Su selector anterior se sustituye por `HomePassagePicker` compacto, con la referencia actual como inicio, manteniendo neutro el Home. Biblia inferior abre el mismo listado nuevo; el antiguo diálogo deja de montarse. Regreso a guías/estudios, versión, progreso, guardados, opciones e inmersión conservan sus flujos. La búsqueda de referencias y texto continúa en el catálogo `/bible`.

Verificación final: lint, 165 unitarios, build y auditorías aprobados; E2E completo con 122 pruebas aprobadas y 20 omisiones previstas. [Evidencia visual](evidence/home-integration-fidelity-2026-10-12/README.md): 56 combinaciones en Chromium y WebKit 26.5, incluidos lector EN/PT y texto al 200%, sin desbordes ni solapes. La publicación de esta ampliación se valida contra su propio SHA después del push.

### Visibilidad del vidrio y limpieza del lector · 12/10/2026

El A/B de producción confirma que el manto estaba pintado, con poco contraste especialmente en claro; no estaba detrás de una capa opaca. Se refuerzan reflejo superior, refracción fría/cálida y luz diagonal, manteniendo su ancho y desaparición gradual al final de los artículos.

El selector compacto deja de recibir la referencia en curso: inicia neutro y se limpia al abrir otro libro/capítulo. La marca del lector se alinea con Home; el botón textual “Volver” y el selector pasan a una banda del fondo de lectura situada debajo de la barra de vidrio. Se conserva retorno contextual, teclado, menús adaptativos y navegación inmersiva.

Verificación: lint, 7 unitarios afectados, build y auditorías, 28 E2E aprobados/4 omisiones previstas, `git diff --check`. [Evidencia](evidence/glass-reader-refinement-2026-10-12/README.md): 40 combinaciones responsive en Chromium/WebKit y A/B de pintura real en ambos temas. Publicación pendiente de verificación contra el SHA propio del nuevo push.

### Corrección del material de vidrio · 12/10/2026

El usuario señaló que los gradientes reforzados parecían una mancha. Se eliminan las tintas radiales y el glow desenfocado: el acabado pasa a un plano neutro con desenfoque de 10 px y un reflejo/labio superior definido en una capa independiente. Los laterales se pierden en 420 px y no hay borde inferior. El paisaje se extiende debajo del selector para que el vidrio tenga textura real detrás; el manto conserva el ancho del cuerpo y su desvanecimiento detrás de los artículos.

Lint, build/auditorías, `git diff --check` y ocho E2E aprobados. [Evidencia](evidence/glass-specular-2026-10-12/README.md): 16 combinaciones Home en Chromium/WebKit, ambos temas, 320–1440 px. Sin cambios en la navegación o limpieza del lector; la publicación se contrasta después del push con el SHA propio de esta corrección.

### Aire, footer compartido y regreso al inicio del capítulo · 12/10/2026

El vidrio termina bajo el selector y se desvanece antes de “También en Santa Biblia”, manteniendo su ancho. Hero y selector ganan un espaciado moderado. Se elimina la excepción que lavaba el footer del Home y se igualan a 44 × 44 px los controles de tema/ajustes de la cabecera compartida.

Al final del lector, Anterior / Inicio / Siguiente aprovechan el ancho disponible; Inicio sube al capítulo actual y enfoca el título sin cambiar la URL ni la versión. Se respeta movimiento reducido, se simplifican etiquetas visibles en móvil y se conserva el destino completo accesible.

Lint, build/auditorías, 14 E2E distintos y `git diff --check` aprobados. [Evidencia](evidence/home-spacing-chapter-start-2026-10-12/README.md): 24 vistas Chromium/WebKit, cuatro casos EN/PT al 200% y ocho verificaciones de límites de la Biblia. La publicación se contrasta después del push con el SHA propio de este ajuste.

### Recuperación de audio cuando Nuevo Tiempo no responde · 12/10/2026

La función publicada devolvió `unavailable` para la lectura del día, aunque Nuevo Tiempo ya había publicado el episodio de Salmos 66. Las consultas a WordPress/RSS agotaban el tiempo; el VOD sí aceptó una petición de rango de un byte. Se añade metadata fallback verificada únicamente para el 12/10 y Salmos 66; nunca se asigna a otra lectura. El MP3 continúa directamente desde VOD, sin proxy ni descarga local.

Prueba del endpoint con proveedores inalcanzables, validación de lectura distinta, lint y build/auditorías aprobados. [Fuente y comprobaciones](SOURCES_AUDIO_RPSP.md#respaldo-puntual-de-episodio-publicado--12-de-octubre-de-2026); publicación pendiente de confirmar el nuevo endpoint en producción.

## Revisión transversal · diseño editorial y navegación · 16/09/2026

**Alcance:** sitio completo, incluidas las pantallas anteriores al plan. Se conserva el hero y el carácter de las ilustraciones; la guía vigente es [Sistema editorial](../design/SISTEMA_EDITORIAL_VIGENTE.md).

**Refinamientos:**

- Acciones principales unificadas en azul suave mediante un par fondo/tinta explícito para día y noche; las pantallas antiguas dejan de usar el degradado coral. El coral se reserva para detalles y estados activos.
- Distintivos del curso con superficie cálida y tinta propia en cada tema; avisos de error adaptados a noche. Sombras comunes más discretas y rótulos de página con la misma jerarquía tipográfica.
- Eliminada la doble navegación entre 900 y 1023px. Encabezado y etiquetas permiten texto ampliado sin solaparse; el lector conserva su animación y auto-ocultamiento originales.
- Corregido el reflujo al 200% en filtros/rejilla de temas, lecciones, Guardados y contexto del audio. El tamaño de los controles gráficos compactos del reproductor deja de duplicarse al ampliar sólo texto.
- Restauración de posición por entrada de historial para páginas generales que cargan después de la restauración nativa; no interfiere con referencias/progreso del lector ni reinicia la página al escribir una consulta.
- Alineada la documentación de biblioteca con la decisión del usuario: sin texto íntegro reutilizable no se publica sección ni catálogo externo.

**Evidencia:** [capturas y reproducción](evidence/revision-integracion/README.md). Diez pantallas, ambos temas: 100 combinaciones a tamaño normal (320, 390, 768, 950 y 1440px), y 80 con texto al 200% (320, 390, 768 y 1440px), sin desbordamiento horizontal. Se inspeccionaron además las capturas para detectar solapamientos que la medida de ancho no descubre.

**Verificación técnica:** lint y build aprobados, incluidos contrato público y auditoría del corpus. La suite unitaria inicial pasó 158/160; dos pruebas de imágenes sociales agotaron tiempo con tareas concurrentes. Su archivo completo pasó después aislado (7/7), sin modificar límites ni lógica. La restauración al Home pasó cinco repeticiones aisladas. La prueba del final de capítulo espera ahora fuentes y texto antes de desplazar; no se cambió el auto-ocultamiento de producción.

**Cierre de verificaciones:** `npm run test -- --maxWorkers=2`: 160/160 aprobadas. E2E finales ejecutados en dos grupos: navegación/lector/búsqueda 66 aprobadas y 14 omitidas por plataforma; Home/Reavivados/curso/temas 48 aprobadas y 6 omitidas. Total: 114 aprobadas, 20 omisiones previstas, sin fallos pendientes. `npm run lint`, `npm run build` y `git diff --check`: aprobados. El usuario autorizó sincronizar `main` local con `origin/main` tras cerrar la revisión.

**Límites:** emulación Chromium; esta revisión no certifica Safari/iOS físico, reproducción real del proveedor ni cierra los pendientes de fuentes de biblioteca. La etapa 7 queda cubierta en su revisión visual y regresión de los flujos existentes; no equivale a implementar 6B/6C.

## Etapa 5A · Índice de La Fe de Jesús

**Estado:** implementada, verificada e integrada en `main`.

**Implementado:** `/studies/la-fe-de-jesus` adquiere una portada propia, sin alterar ninguna lección ni su contenido. Combina el arte instalado del curso con un velo azul/lila, título y texto HTML, y una acción que muestra “Comenzar estudio” a una persona nueva o “Continuar estudio” hacia su próximo paso real si existe avance. El progreso continúa leyendo la misma clave y conserva sus valores, su porcentaje y la lección de retorno.

El recorrido mantiene las mismas veinte lecciones, orden, rutas, bloqueos y requisitos. En escritorio las fichas aparecen en dos columnas; en móvil se muestran en una sola columna para proteger los títulos y estados. Las fichas completadas, en curso y bloqueadas conservan su semántica y siguen apuntando a los mismos destinos.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 160 pruebas aprobadas.
- `npm run test:e2e -- e2e/study-flow.spec.js`: 6 pruebas aprobadas en móvil y escritorio. Incluye una comprobación nueva de ruta, inicio, continuación, progreso real, veinte lecciones y disposición responsive.
- `npm run build`: aprobado; índice, contenido del curso, contrato público y corpus auditados.
- `git diff --check`: sin errores.

**Evidencia durable:** [capturas responsive del índice](evidence/etapa-5a-indice-curso/README.md), con 320/390/768/1440 px, claro/oscuro, texto ampliado y dos estados de avance. Son emulación Chromium.

**Siguiente paso tras integrar:** 5B · páginas de lección y evaluación. Esta etapa se encuentra implementada localmente y pendiente de la revisión manual descrita más abajo.

## Etapa 5B · Lecciones de La Fe de Jesús

**Estado:** implementada, verificada y aprobada en la prueba manual; integrada en `main`.

**Implementado:** cada ruta de lección conserva sus textos, preguntas, respuestas, requisitos, rutas y claves de progreso, pero recibe una composición propia: retorno contextual, cabecera de papel con medallón ocre, título en Playfair y cuerpo centrado de hasta 46 rem. La lectura se adapta a la familia tipográfica, escala y espaciado elegidos por la persona; las ilustraciones no invaden los párrafos.

Las preguntas de estudio conservan sus lecturas bíblicas bajo demanda. El test final sigue al término de cada lección, pero sus tres preguntas comienzan cerradas para reducir el largo vertical; al abrir una se registra la posición, y al volver desde una lectura bíblica se reabre exactamente la pregunta pendiente. La corrección, el reintento, el desbloqueo, la revisión de una lección completada y el siguiente paso real conservan su comportamiento previo.

**Navegación móvil:** el auto-ocultamiento queda reservado al lector bíblico genérico. La navegación inferior global permanece fija en Reavivados, fichas temáticas y lecciones del curso, incluso al llegar al final del contenido.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test -- src/features/studies src/features/reader/useReaderImmersion.test.js`: 26 pruebas aprobadas.
- `npm run test:e2e -- e2e/study-flow.spec.js e2e/topic-detail.spec.js e2e/reavivados.spec.js`: 23 pruebas aprobadas y 3 omitidas por pertenecer al proyecto de escritorio. Cubre el test final cerrado, avance y reintento, retorno desde el lector, preferencias de lectura y la barra global fija fuera del lector.
- `npm run test`: 160 pruebas aprobadas.
- `npm run build`: aprobado; índice bíblico, contenido de las 20 lecciones, contrato público y corpus auditados.
- `git diff --check`: sin errores.

**Evidencia durable:** [capturas de lección](evidence/etapa-5b-lecciones-curso/README.md) a 320, 390, 768 y 1440 px, claro/oscuro y texto ampliado. Son emulación Chromium.

**Prueba manual de cierre:** aprobada antes de integrar. Se revisó la primera lección, el espacio recuperado con el test final cerrado y la barra inferior fija en móvil fuera del lector.

## Etapa 6A · Derechos de biblioteca

**Estado:** investigación documentada; no se ha verificado una fuente reutilizable de estas ediciones entre las revisadas. La biblioteca no está disponible en la app.

**Decisión de fuente:** la revisión actual de las ediciones españolas de *El Camino a Cristo* y *El Deseado de Todas las Gentes* no autoriza importarlas. El aviso legal de White Estate reserva sus contenidos y el EULA no concede a terceros la redistribución ni una base de datos en línea. La evidencia por edición, edición/año, URL y decisión está en [docs/content-sources/egw.md](../content-sources/egw.md).

**Alcance cerrado:** no hay ruta `/library`, tarjeta o enlace desde Home, catálogo externo, lector, capítulo, búsqueda, progreso, caché offline, PDF, portada ni corpus de estas obras en Santa Biblia. El acceso gratuito en EGW Writings no se presenta como biblioteca disponible dentro de la aplicación.

**Condición para reabrir:** una autorización escrita o licencia pública verificable que cubra la edición española concreta, el servicio web, la transformación por capítulos y, si corresponde, el repositorio público y la caché offline. Hasta entonces `6B` y `6C` permanecen bloqueadas.

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

El bloque editorial “Reflexión del día” se separa del control de audio y conserva “Ver fuente” fuera de él. El player concentra el título de la reflexión y la referencia bíblica, sin una atribución fija que no provenga del episodio. Así, el control no se convierte en una segunda tarjeta de contenido ni desplaza la lectura inicial fuera del primer viewport de 390 px. En móvil, Reavivados conserva la navegación inferior global fija; el auto-ocultamiento y su transición suave quedan reservados para el lector bíblico.

El capítulo utiliza la versión bíblica y escala de texto elegidas. Carga y reintenta en forma independiente de la metadata/audio: sin reflexión, la lectura sigue disponible. No añade selector, siguiente capítulo, lista de episodios, notas, guardados ni sugerencias dentro de la cápsula. El capítulo y episodio en curso se mantienen al cambiar el día durante una sesión de audio; la persona ve una acción explícita para abrir la lectura del nuevo día.

El progreso de esta experiencia se guarda únicamente en `santa_biblia_v2_rpsp`, con fecha civil, referencia, versículo, porcentaje de scroll y posición de audio. Entrar a Reavivados siempre conserva el encabezado en pantalla: el progreso no desplaza automáticamente la nueva visita. El estado de lectura libre de Home no se modifica. Si el progreso pertenece al capítulo de hoy, la tarjeta de Reavivados muestra “Retomar la lectura de hoy”.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 152 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/reavivados.spec.js e2e/reading-flow.spec.js`: las pruebas relevantes aprobaron en móvil y escritorio, con metadata interceptada y determinista. Cubren la entrada desde el encabezado aun con progreso guardado, la navegación global fija de Reavivados y que la navegación propia del lector siga visible al final; su ocultamiento y transición durante la lectura no se modifican.
- El flujo de navegador comprueba el enlace Home → `/reavivados`, un único reproductor sin `src` inicial, reproducción iniciada por gesto, una sola navegación global, footer, lectura disponible sin audio y fallo/reintento independiente del capítulo.
- `npm run test:e2e` completo: 86 aprobadas y 13 omitidas por proyecto no aplicable. Persiste una sola comprobación histórica ajena a esta entrega: restauración de scroll de Home en móvil obtuvo `188 px` frente al umbral de `>200 px`, ya registrada en 0B; Reavivados y Home actualizado aprobaron.
- `git diff --check`: aprobado durante la implementación.

**Evidencia durable:** [capturas y alcance de 3C](evidence/etapa-3c-reavivados/README.md). Incluye 320, 390, 768 y 1440 px, claro/oscuro y texto ampliado, con metadata simulada del capítulo correcto. La reproducción real con gesto en Safari/iOS y Chrome/Android sigue siendo la prueba manual externa pendiente.

**Observación de fuente en la revisión local:** la URL directa que el propio episodio oficial publica para Salmos 39 (`vod.nuevotiempo.org`) devolvió `403 Forbidden` tanto a una solicitud de rango de un byte como al control del navegador observado en esta revisión. La app no la reemplaza ni la proxifica: muestra el enlace “Ver fuente”, deja el capítulo disponible y comunica que la fuente no permitió cargar el audio. La metadata ya se resuelve; la disponibilidad real del archivo sigue siendo una dependencia de Nuevo Tiempo que debe comprobarse de nuevo antes de integrar.

**Siguiente paso tras integrar 3B/3C:** 4A · nueva navegación de la guía temática.

## Etapa 4B · Ficha temática

**Estado:** completada e integrada en `main` mediante `7791640` (**Crea fichas para la guía temática**).

**Implementado:** cada tarjeta del índice ahora abre `/topics/:categoryId/:situationId` y conserva los filtros `q` y `category` de la guía. La ficha muestra de inmediato sólo el pasaje central y ofrece hasta cinco complementarias por enlaces estables `?reading=companion-N`; sin ese parámetro no se carga ninguna lectura secundaria. Elegir una complementaria conserva la URL compartible y carga sólo ese pasaje.

“Volver a la guía” mantiene la consulta y el área, y la posición del índice se restaura al retornar. “Leer en el lector” pasa el retorno exacto con ficha, parámetros y complementaria activa; el lector regresa a ese punto sin cambiar su navegación. En móvil, la ficha conserva la navegación inferior global fija, igual que las demás secciones fuera del lector bíblico. Los enlaces previos del tipo `?category=…#topic-…` se resuelven comparando IDs editoriales completos, incluso con guiones, y llevan a la ficha equivalente. Una situación inexistente muestra una salida clara hacia la guía.

**Datos y límites:** se conservan los 92 IDs, títulos, orden, central y complementarias de `topics.es.json`; no se añadió contenido doctrinal ni se alteró `TopicPassage`, por lo que las lecciones del curso continúan usando su estilo y retorno actual.

**Verificado en local:**

- `npm run lint`: aprobado.
- `npm run test`: 160 pruebas aprobadas.
- `npm run build`: aprobado; índice, curso, contrato público y corpus auditados.
- `npm run test:e2e -- e2e/topics-explorer.spec.js e2e/topic-detail.spec.js e2e/mobile-navigation.spec.js`: cubre índice, ficha, complementaria bajo demanda, lector y retorno, rutas antiguas, ficha inexistente, navegación global fija en móvil, texto ampliado, 320/390 px y dos columnas desde 768 px.
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
| 3C · Reavivados | Completada e integrada | Ruta diaria, capítulo independiente, progreso separado y evidencia responsive. |
| 4A · Índice de temas | Completada e integrada | Explorador, búsqueda, filtros URL y 92 situaciones accesibles. |
| 4B · Ficha temática | Completada e integrada | Ruta propia, pasaje central, complementarias bajo demanda y navegación fija en móvil. |
| 5A · Índice del curso | Completada e integrada | Portada, avance real y recorrido responsive de 20 lecciones. |
| 5B · Lecciones | Completada e integrada | Composición de lección, evaluación final colapsada y navegación fija fuera del lector. |
| 6A · Derechos de biblioteca | Investigación documentada | Sin fuente apta; no se expone biblioteca ni lector. |
| 6B / 6C · Libros internos | Dependientes de fuente por título | Texto íntegro y lector separado. |
| 7 · Integración nueva | Pendiente | QA conjunta y estado de publicación. |

## Formato de actualización por etapa

Añadir fecha, etapa, commit, archivos, comportamiento entregado, pruebas con resultado, ubicación durable de capturas y pendientes concretos. Distinguir implementación, verificación y publicación. Una prueba con red simulada no sustituye reproducción real; un enlace externo no completa el lector interno.
