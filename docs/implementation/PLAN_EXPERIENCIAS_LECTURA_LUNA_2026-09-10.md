# Experiencias de lectura — plan de ejecución para Luna

Fecha: 10 de septiembre de 2026. Estado: diseño y planificación; las nuevas secciones no están implementadas.

Este documento es el encargo vigente para la siguiente actualización. Sustituye decisiones visuales incompatibles del plan del 9 de septiembre: ahora se autoriza mejorar la primera tarjeta, suavizar sus botones, dar identidad a Reavivados y al curso, y un retoque limitado al hero. La promesa sigue siendo el centro de la bienvenida. No hay capítulo de inicio recomendado ni selección forzada de Juan 1.

El trabajo previo de selector, búsqueda integrada, botones iguales y footer se entrega como base independiente. Este plan no ordena rehacerlo. Luna debe ejecutar una etapa a la vez, leer únicamente sus dependencias y registrar su resultado antes de seguir. No necesita volver a investigar las decisiones ya cerradas aquí. Si cambia una fuente externa, aplicar el fallback documentado y registrar la diferencia.

## 1. Objetivo y decisiones de producto

1. **Home:** conservar su calma y hacer de la tarjeta posterior al hero una entrada clara y hermosa a la Biblia. En móvil, las acciones se centran respecto de la tarjeta completa; en escritorio se conserva la distribución útil actual.
2. **Reavivados por su Palabra:** nueva experiencia dedicada al capítulo del día: cabecera compacta, audio oficial, capítulo completo y footer. El audio es la cápsula de reflexión del programa; no prometer narración idéntica o sincronizada con cada versículo de la traducción elegida.
3. **Guía temática:** encontrar una situación y leer su pasaje central con menos decisiones y sin expandir múltiples bloques largos. Se conserva todo el contenido.
4. **La Fe de Jesús:** un curso con identidad propia e inmersión, conservando las 20 lecciones, su orden, evaluaciones, requisitos y progreso local.
5. **Biblioteca cristiana:** primero El Camino a Cristo, por ser un primer alcance más acotado; después El Deseado de todas las gentes, si existe una edición completa incorporable. No presentar resúmenes como libros íntegros.

No cambiar el nombre de la aplicación, la promesa elegida para cada día, los cuatro destinos principales de navegación, la funcionalidad del lector bíblico, ni los contenidos bíblicos o doctrinales como parte del rediseño visual.

## 2. Base real del repositorio

Rutas actuales: `/`, `/bible`, `/read/:book/:chapter/:verse?`, `/search`, `/saved`, `/plans`, `/topics`, `/studies/la-fe-de-jesus`, `/studies/la-fe-de-jesus/:lessonSlug`.

| Área | Archivos actuales | Implicación |
|---|---|---|
| Home | `src/features/home/HomePage.jsx`, `HomePage.module.css` | La tarjeta usa `readingActions` en `grid-column: 2` en móvil. Su ancho puede ser igual entre botones y aun estar descentrada. |
| Selector | `src/features/bible/BibleNavigator.jsx`, `BibleNavigator.module.css` | Compartido entre Home, explorador bíblico y lector. Mantener scroll interno y dos columnas de libros. |
| Búsqueda | `src/features/search/useBibleTextSearch.js`, `searchEngine.js`, `src/workers/searchWorker.js` | Texto consultado en worker por versión. Límite actual de 100 y coincidencias por subcadena: ver tarea 0B. |
| Plan diario | `src/features/plans/rpsp2026.js`, `PlansPage.jsx` | Calendario limitado a 2026. Home enlaza hoy directamente a `/read/...`; `/plans` muestra calendario. |
| Cambio de día | `src/features/home/useLocalDay.js`, `dailyPromise.js` | Ya existe reloj civil local con actualización a medianoche. Reutilizarlo y añadir recuperación de foco; no crear fechas divergentes para Home y Reavivados. |
| Datos bíblicos | `src/features/bible/bibleRepository.js` | Reutilizar `loadChapter`, normalización, abortos, caché y versión elegida. No descargar otro corpus. |
| Lector | `src/features/reader/ReaderPage.jsx`, `useReadingProgress.js` | Mezcla lectura, router, acciones y progreso. No montar un `ReaderPage` entero dentro de otra página. |
| Temas | `src/features/topics/TopicsPage.jsx`, `TopicPassage.jsx`, `data/topics.es.json` | 13 áreas y 92 situaciones. `TopicPassage` también se usa en el curso. |
| Curso | `src/features/studies/`, `src/content/la-fe-de-jesus/` | 20 lecciones, 174 preguntas del material, 188 referencias, 60 preguntas de evaluación en total. |
| Estructura | `src/components/layout/AppShell.jsx`, `AppFooter.*`, `src/app/routes.jsx` | El footer está excluido sólo del lector bíblico. Evitar dos cabeceras en rutas inmersivas. |
| Preferencias | `src/features/settings/SettingsProvider.jsx` | Versión predeterminada NBLA; respetar versión, tema, tipografía y tamaño seleccionados. |
| Hosting | `vercel.json`, `api/`, `vite.config.js` | Hay funciones Vercel y un rewrite general a `index.html`. Las APIs nuevas necesitan resolución y desarrollo local explícitos. |

Las referencias visuales del usuario son: paisaje azul/dorado con pradera y Biblia abierta de RPSP; portada azul/lila con Jesús y flores del curso; página de estudio con cinta ocre y papel luminoso. La segunda imagen dice **Curso Bíblico / Está Escrito**. No usarla para cambiar autoría, título, primera lección ni secuencia del contenido instalado.

El material interno empieza por “¿Quién es Dios?”; la imagen de muestra empieza por “La Biblia”. La referencia es visual. No sustituir el texto de una edición por el de otra para hacer coincidir la imagen.

## 3. Dirección visual cerrada

### 3.1 Paleta y composición

Mantener `Playfair Display` para títulos, `Lora` para lectura e `Inter` para interfaz. Reutilizar las variables Aurora Champagne de `src/styles/tokens.css`; las variantes pertenecen al módulo de cada experiencia, no a reglas globales sobre todos los botones.

| Superficie | Identidad | Aplicación |
|---|---|---|
| Hero | Amanecer, promesa, luz suave | Imagen existente. Ajustar sólo legibilidad del degradado y separación con tarjeta si la captura lo justifica. |
| Tarjeta Biblia | Papel cálido y azul grisáceo | Fondo editorial actual; botón principal azul profundo suave y segundo azul neblina, ambos del mismo tamaño. |
| Reavivados | Cielo azul, horizonte dorado, pradera verde | Arte panorámico reconocible, con Biblia abierta a la derecha y espacio de texto a la izquierda. |
| Temas | Marfil, salvia y calma | Navegación clara, pocas decoraciones; la situación buscada y el texto pesan más que los números de categoría. |
| Curso | Azul profundo, lila floral, oro antiguo | Imagen de bienvenida y detalles del encabezado; el cuerpo de estudio permanece sobre papel legible. |
| Biblioteca | Papel y cubiertas editoriales | El texto tiene prioridad; cubiertas sólo en catálogo e índice, no detrás de párrafos. |

Modo oscuro: derivar colores de los tokens oscuros existentes. No invertir fotografías ni dejar paneles blancos. Para texto normal, verificar contraste mínimo 4.5:1; para controles/foco visibles, 3:1. Los tonos pastel son superficies, no texto claro sobre blanco.

No añadir carruseles, parallax, ondas animadas falsas, partículas, fondos de video ni una segunda gran portada encima del capítulo. Respetar `prefers-reduced-motion`.

### 3.2 Primera tarjeta, especificación de entrega

**Con historial:** etiqueta “Tu momento con la Palabra”, referencia guardada como título, apoyo “Retoma tu última lectura.”; acciones exactas “Continuar leyendo” y “Elegir una lectura”. La primera abre la posición guardada; la segunda abre libros sin imponer capítulo.

**Sin historial:** título “Comenzar a leer”, apoyo “Elige un libro y un capítulo para comenzar.” y un único botón “Elegir una lectura”. No fabricar historial ni mostrar un botón Continuar deshabilitado.

Móvil menor de 900 px:

- Encabezado de icono y texto en su fila actual; acciones en otra fila con `grid-column: 1 / -1`, `justify-self: center` y `width: min(100%, 24rem)`.
- De 360 px en adelante, dos columnas iguales con separación de 8–10 px. Ambos botones ocupan todo su track, mínimo 48 px de alto y mismo padding.
- Debajo de 360 px, apilar con un ancho común de hasta 17rem, centrado. Con texto ampliado permitir apilado para conservar etiquetas completas.
- Quitar la flecha exclusiva de Continuar si obliga a partir su texto antes que el del segundo botón; dos etiquetas equilibradas son suficientes.
- Con una sola acción, ancho natural acotado y centrado; no reservar un segundo hueco.

Escritorio desde 900 px: icono, copia y grupo de acciones como ahora, con el grupo a la derecha y alineación vertical central. Dos tracks de igual ancho; no agrandar toda la tarjeta para simular un nuevo hero.

Colores iniciales: principal `--accent-blue-deep` con texto de contraste apropiado al tema; segundo una mezcla de `--surface-soft` y `--accent-mist` con borde azul tenue y texto `--ink`. En oscuro usar el azul claro del tema con texto oscuro. Mantener sombra corta y bordes redondeados. El objetivo es evitar la oposición rojo saturado/blanco puro.

Retoque autorizado al hero: sólo transición de luz hacia esta tarjeta y corrección de espaciado que resulte necesaria. Comparar promesa corta, mediana y larga a igual fecha/tema antes y después. Conservar el hero completo si no hay una mejora visual evidente.

### 3.3 Arte de tarjetas y cabeceras

RPSP: reproducir la idea de paisaje del adjunto mediante una ilustración original: pradera al amanecer, cielo azul abierto, nubes luminosas, Biblia abierta sobre el tercio derecho. Mantener una zona limpia a la izquierda. Tipografía real en HTML, no texto incrustado ni logotipo deformado. Atenuar verdes/amarillos para integrarlo en Home, sin perder identidad.

Curso: ilustración original de Jesús como figura acogedora, túnica marfil, fondo azul/lila y flores suaves, composición que recuerde la referencia y permita leer la tarjeta. No incrustar “Está Escrito”, firmas ni logotipos de terceros como si fueran marca del sitio. Encabezado de lecciones con pequeño número/tema sobre una cinta ocre contemporánea; no copiar líneas punteadas ni formularios de la captura si no existen en el contenido.

Al producir bitmaps usar la skill imagegen disponible en esa sesión y entregar los archivos finales; no delegar a Luna una instrucción vaga de “buscar algo bonito”. Si la herramienta no está disponible, continuar con las imágenes actuales y registrar **arte pendiente**, no declarar terminada la etapa visual. Se encontró una fuente oficial de material editable RPSP, que se puede evaluar como alternativa: [wallpaper de la División Sudamericana](https://downloads.adventistas.org/es/asociacion-ministerial/materiales-de-divulgacion/diseno-abierto-wallpaper-rpsp/). “Diseño abierto” describe el material ofrecido; comprobar condiciones del archivo antes de reutilizar una marca o composición exacta.

Archivos finales propuestos: `public/assets/home-rpsp-landscape-v1.webp`, `home-study-invitation-v1.webp`, `rpsp-header-v1.webp`, `study-header-v1.webp`. Variantes móviles sólo si el recorte no funciona. Tarjetas objetivo ≤180 KB cada una, cabeceras ≤250 KB. Son presupuestos de implementación, no medidas actuales. No aumentar el precache con varias versiones de una imagen sin uso: `vite.config.js` precachea imágenes del build.

## 4. Reavivados: experiencia y datos

### 4.1 Rutas y pantalla

Nueva ruta canónica **`/reavivados`**, resuelta al día local del visitante. `/plans` se conserva como calendario secundario durante esta versión. La tarjeta Home va a `/reavivados`, nunca directamente al lector genérico. No añadir selector de fecha, libro/capítulo, siguiente capítulo ni lista de episodios en esta experiencia: el centro es sólo el audio y la lectura de hoy.

Composición:

```text
Navegación compacta: Inicio / Reavivados                  Ajustes
Franja de paisaje; Reavivados por su Palabra · fecha · referencia

Reflexión del día · Pr. Bruno Raso*         Fuente: Nuevo Tiempo
[ −15 s ] [ Reproducir/Pausar ] [ +15 s ]          [ 1× ]
00:00 ─────────────────────────────────────────── duración real

Salmos 34 · versión elegida
Capítulo completo, ancho de lectura, tipografía y ritmo existentes

Footer con identidad actual y crédito de la fuente
```

\*La grafía oficial encontrada es **Bruno Raso**. Usar la atribución que confirme la ficha del episodio; si no la confirma, mostrar sólo el nombre del programa/fuente. No inventar duración, autor, transcripción o traducción del audio.

Ancho de lectura máximo 45rem; cabecera visual de hasta 64rem en escritorio, alta como una introducción compacta (aprox. 10–13rem), no como Home. Player en el mismo ancho del texto. Móvil con márgenes de 16–20 px. Al desplazar, player fluye con la página; no añadir mini reproductor flotante en la primera entrega.

Navegación global y footer presentes, sin bloques de recomendaciones entre audio y capítulo. Mantener los cuatro destinos de la navegación móvil; marcar Reavivados en la cabecera contextual, no añadir un quinto destino que comprima los existentes.

### 4.2 Fuente verificada y selección correcta

La [página aportada por el usuario](https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/gustad-y-ved-que-bueno-es-el-senor-salmo-34-reavivados-por-su-palabra/) expone el MP3 oficial del episodio. El [RSS oficial](https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/feed/) incluye los enlaces de medios mediante `enclosure`. Usarlo como fuente primaria. La URL comprobada para ese episodio es `https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3`; no construir enlaces futuros a partir de ese patrón.

En la comprobación del medio se obtuvieron `audio/mpeg`, soporte de rangos y respuesta 206 a una solicitud mínima. No se observó cabecera CORS para el origen de prueba: reproducir con `<audio src>` sin `crossOrigin`, sin `fetch`→blob y sin Web Audio. Esto permite diseñar reproducción directa, pero no sustituye una prueba real de reproducción/avance en Safari y Android antes de publicar.

La referencia esperada procede del calendario, no del último episodio del feed. `getRpspReading(new Date(2026, 8, 10, 12))` debe dar libro 19, capítulo 34. La portada oficial de [Revival & Reformation](https://www.revivalandreformation.org/bhp) mostraba Salmos 34 durante esta revisión. El [listado oficial de calendarios](https://www.revivalandreformation.org/bhp/printable-reading-schedules) permite comprobar cambios de año; no extrapolar el calendario 2026 a 2027.

Contrastar fecha del episodio y referencia exacta. No aceptar una coincidencia de texto “34” que también pueda ser “134”, otro libro o una descripción incidental. No marcar un episodio anterior como “audio de hoy” aunque sea reciente. Una grabación de otro ciclo requiere selección editorial explícita y rótulo de archivo; esa opción queda fuera del primer alcance.

### 4.3 Contrato y arquitectura

Crear:

- `api/rpsp.js`: endpoint de **metadatos**, nunca proxy de audio.
- `api/_lib/rpspFeed.js`: adaptador RSS, validación y normalización compartida con desarrollo/tests.
- `src/features/plans/rpspDate.js`: fecha civil local y referencia, utilizando el calendario existente.
- `src/features/plans/rpspRepository.js`: cliente con abortos y estados; devuelve metadata validada.
- `src/features/plans/data/rpsp-audio-overrides.json`: correcciones editoriales opcionales por fecha, sólo URLs y procedencia verificadas.
- `src/features/plans/data/rpsp-audio-fallback.json`: último conjunto pequeño verificado de metadatos, versionado; no MP3.

Petición fija: `GET /api/rpsp?date=2026-09-10`. Validar fecha estricta `YYYY-MM-DD`, rango de calendario y referencia del lado del servidor. El endpoint no acepta una URL arbitraria para descargar. Lista de hosts HTTPS permitidos basada en la fuente verificada; revisar también redirecciones.

Para calcular el día del plan desde una cadena, separar año/mes/día, validar que la fecha existe y calcular su ordinal mediante `Date.UTC`; llamar a `getRpspReadingByDay` existente. No pasar `new Date('YYYY-MM-DD')` a código que interpreta componentes locales ni usar `toISOString()` para obtener el día local del visitante. El navegador construye su fecha civil; el servidor resuelve la fecha solicitada, independientemente de su zona horaria. No serializar el campo `Date` auxiliar del calendario como si fuera el día solicitado.

Contrato propuesto:

```json
{
  "schemaVersion": 1,
  "date": "2026-09-10",
  "reference": { "book": 19, "chapter": 34 },
  "status": "ready",
  "episode": {
    "id": "identificador-estable-del-feed",
    "title": "titulo-exacto-normalizado",
    "publishedAt": "fecha-ISO-de-la-fuente",
    "presenter": null,
    "language": "es",
    "sourcePageUrl": "https://www.nuevotiempo.org/audio/.../",
    "audioUrl": "https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3",
    "mimeType": "audio/mpeg",
    "durationSeconds": null
  },
  "checkedAt": "instante-ISO-real",
  "provenance": "rss"
}
```

Valores cerrados de `status`: `ready`, `pending`, `unavailable`, `out_of_calendar`. `episode` es `null` salvo audio validado. Diferenciar ausencia temporal de episodio (`pending`) de fallo de red/feed (`unavailable`). Los ejemplos `...` y fechas descriptivas de este documento no son datos de producción.

Algoritmo:

1. Validar día y calcular referencia desde el calendario.
2. Aplicar override de esa fecha si existe y pasa validación de referencia, origen y URL.
3. Consultar feed usando `ETag`/`Last-Modified` cuando existan. Parsear XML con parser mantenido, sin resolver entidades externas; `fast-xml-parser` es una dependencia candidata a verificar e incorporar sólo aquí. Fijar versión en lockfile.
4. Seleccionar entrada exacta por fecha civil declarada en `pubDate` con su offset explícito y libro/capítulo normalizados. Conservar por separado `publishedAt` (instante) y `date` (día de lectura). Si fecha y referencia no resuelven coherentemente, contrastar `date` civil de WordPress mediante el fallback; no adivinar una zona editorial por la zona del servidor.
5. Si falta la entrada, usar el fallback oficial WordPress/HTML descrito en el informe de fuentes; consulta acotada por fecha/programa, no rastreo del catálogo en cada visita. Extraer sólo `audio src` si no hay `enclosure`; sanitizar todo texto.
6. Sin entrada válida, devolver `pending`; ante fallo de fuente, recurrir únicamente a snapshot de **esa misma fecha/referencia**, o `unavailable`. Nunca reproducir el día anterior como sustituto silencioso.

Caché: metadata normal positiva con `s-maxage=900, stale-while-revalidate=3600`; ausencia/error con máximo 120 s para detectar nuevas publicaciones. No cachear errores un día completo. Límite upstream 6 s por petición, presupuesto total de 12 s, máximo tres peticiones y documentos de hasta 1 MB; deduplicación de solicitudes simultáneas en proceso como optimización, sin asumir persistencia de memoria entre invocaciones. El componente del navegador hace una petición por fecha; reintentos acotados al volver al foco si lleva más de 15 min ausente. No polling continuo.

En `vercel.json`, añadir resolución explícita `/api/rpsp` antes del rewrite general de SPA, y verificar que su respuesta sea JSON, también en enlace directo. Revisar empaquetado de función para excluir corpus bíblico/medios que no usa. Seguir el handler Request→Response existente en `api/share-page.js`. Agregar un plugin Vite con `configureServer` y `configurePreviewServer` que adapte ese mismo handler en `/api/rpsp`, para que dev y preview funcionen sin segundo proceso ni credenciales cloud. No duplicar lógica. Tests E2E interceptan este endpoint; prueba externa manual aparte.

Los metadatos del día no se guardan en el caché largo de `/data/*.json` del service worker. El MP3 no se precachea, descarga como archivo, reenvía ni sirve desde Vercel. El caché normal del navegador al reproducir no es un archivo añadido al proyecto.

No crear un cron de Codex ni GitHub Action diario sólo para que el sitio cambie de día: la resolución se hace bajo demanda y con caché. El snapshot es respaldo, no un calendario de audio inventado.

### 4.4 Player y lectura

Crear `DailyAudioPlayer.jsx/.module.css` alrededor de un solo `HTMLAudioElement`, con reproducción iniciada únicamente por gesto del usuario. `preload="none"`; cargar el medio al reproducir. Inicialmente duración “—:—”, nunca un número ficticio. Controles: reproducir/pausar, ±15 segundos, progreso accesible con teclado y velocidad 1×/1.25×/1.5×. Volumen no es requisito para móvil; usar el control del dispositivo.

Estados a implementar: metadata pendiente, listo, cargando tras play, reproduciendo, pausado, buscando posición, finalizado, error recuperable y sin audio. Actualizar UI desde eventos `loadedmetadata`, `play`, `pause`, `waiting`, `playing`, `timeupdate`, `seeking`, `seeked`, `ended`, `error`. Atrapar rechazo de `play()`. No usar el icono de pausa como señal optimista si el audio no empezó.

Al desmontar, pausar, quitar listeners y liberar src. Con cambio de fecha mientras se reproduce, mantener el capítulo/episodio activo; mostrar aviso discreto “Ya está disponible la lectura de hoy” con acción para cambiar. No sustituir audio a mitad de escucha. Pausado o antes de comenzar, permitir cambio de día con confirmación de contexto visible. Recalcular fecha al recuperar foco y al siguiente cambio de medianoche local, no con un `useMemo([])` permanente.

El capítulo carga independientemente del endpoint de audio. Si no hay audio o se cae Nuevo Tiempo, el texto sigue disponible y se muestra “El audio de hoy aún no está disponible” o “No pudimos cargar el audio”, con reintento o enlace oficial correspondiente. No mostrar enlace de un episodio incorrecto.

Crear `DailyReadingPage.jsx/.module.css` y un componente de texto acotado `DailyChapterText.jsx` con `loadChapter` existente. En esta primera entrega, párrafos/versículos semánticos, títulos, versión y ajustes; no duplicar menús de notas, comentarios o guardados del lector. Así se respeta “audio y lectura, nada más” y se evita un refactor masivo de `ReaderPage`.

Progreso de la cápsula separado en `santa_biblia_v2_rpsp`: `{schemaVersion, date, reference, verse, scrollProgress, audioPosition, updatedAt}`. No escribir en el progreso de La Fe de Jesús. La tarjeta Continuar del Home sigue reflejando la lectura bíblica libre; la tarjeta Reavivados puede indicar “Retomar la lectura de hoy” si hay progreso de ese mismo día. No retomar automáticamente audio del día anterior.

## 5. Guía temática: nueva navegación

Mantener `/topics` como entrada. Presentar la pregunta “¿Qué necesitas hoy?”, buscador visible y 92 situaciones accesibles sin tener que conocer el nombre de una categoría. Categorías como filtro, no como puerta obligatoria.

En móvil: fila de filtros desplazable con “Todas” y acceso “Ver áreas” a un panel completo; debajo, tarjetas compactas de situaciones, en orden editorial actual, cada una con título, área discreta y referencia principal. Mostrar inicialmente 12 y botón “Ver más”; búsqueda y filtros siempre operan sobre las 92, no sobre las 12 renderizadas. No declarar “populares” o “recomendadas” sin datos.

En escritorio: categorías en columna lateral de 15–17rem, sticky bajo la cabecera, y resultados en dos columnas. Una sola página con scroll normal; no otra combinación de dos paneles altos con scroll salvo si el alto disponible exige acotar el listado de filtros.

Nueva ruta **`/topics/:categoryId/:situationId`**: cabecera con “Volver a la guía”, título de la situación, pasaje central completo y selector de lecturas complementarias. Una complementaria abierta a la vez y controles con sus referencias reales. No cargar todos los pasajes de todas las situaciones en el índice. El pasaje central tiene “Leer capítulo completo” que abre el lector y permite volver al mismo lugar de la guía.

Datos inalterados: IDs, títulos, referencia central, complementarias y orden en `topics.es.json`. No generar consejos doctrinales nuevos, reinterpretar promesas ni resumir pasajes con IA. La interfaz EN/PT mantiene “Contenido en español” cuando corresponda; no fingir traducción del catálogo.

Búsqueda de situaciones: tokenizar y normalizar acentos/mayúsculas; exigir todos los tokens en el conjunto de título, área y referencias. Para una consulta que sea referencia, normalizarla para comparar equivalencias. Diferenciarla de la búsqueda de palabras de la Biblia del selector; ésta es una guía por necesidades, no otro motor bíblico. Agregar sinónimos editoriales sólo con una lista explícita revisada, fuera del primer alcance.

URL y retorno:

- `?q=` y `?category=` preservados como estado del índice; búsqueda y categoría se combinan. Al cambiar categoría se conserva la consulta visible; si no hay coincidencias, ofrecer limpiar búsqueda o ver todas las áreas. Escribir texto con `replace`, seleccionar situación con navegación normal y reiniciar el límite visible a 12 al cambiar filtros.
- En la ficha, `?reading=<id>` identifica una complementaria mediante su ID existente o un ordinal estable derivado de su posición editorial. Sin parámetro se muestra sólo el pasaje central; valor inválido se elimina. Preservar `q`/`category` al volver al índice y restaurar su posición de scroll. No crear IDs aleatorios.
- Traducir enlaces antiguos `?category=<id>#topic-<categoryId>-<situationId>` a la nueva ficha con una tabla derivada de IDs, sin dividir ingenuamente por guiones.
- Al abrir lector, conservar `returnTo`, `returnSource: 'topics'`, `returnLabel`, `attentionVerse: true`, query y hash exactos. Atrás devuelve filtro y posición.
- Situación inexistente: mensaje y enlace a guía; no pantalla vacía ni excepción.

Crear `TopicDetailPage.jsx`, `topicSearch.js`, `topicRoutes.js` y estilos locales. Usar `TopicPassage` sin cambiar su contrato por defecto; si necesita una presentación especial, añadir una variante explícita usada sólo por temas. El curso lo importa también: comprobar esa regresión.

## 6. La Fe de Jesús: identidad sin alterar el aprendizaje

Conservar las dos rutas actuales. En `/studies/la-fe-de-jesus`, cabecera azul/lila con la ilustración y el nombre del curso en HTML, estado de progreso y acción “Comenzar estudio” o “Continuar estudio”. Debajo, índice de 20 lecciones en orden como recorrido editorial, con estados actuales, sin otra landing intermedia.

La tarjeta Home y la cabecera comparten arte/tonos. Una miniatura o recorte puede reutilizar el mismo archivo si ahorra peso. Mostrar el siguiente paso real de la persona, sin racha, urgencia ni contador artificial.

Dentro de cada lección: cabecera contextual compacta, número de estudio en medallón/cinta ocre, título, cuerpo en papel marfil/oscuro y navegación clara. El paisaje o las flores quedan arriba y en márgenes, nunca debajo del texto de lectura. Ancho 42–46rem, tamaño y altura de línea según preferencias.

Preservar bloques del material, referencias, decisión personal existente y preguntas. El test de tres preguntas continúa **al final**; no redistribuirlo dentro de la lección por imitar la imagen. Mantener respuesta, corrección, reintento, confirmación de lectura y requisitos de desbloqueo actuales.

No cambiar slugs, IDs de preguntas, claves de almacenamiento, schema de progreso ni estados de completado como parte del estilo. Al volver desde un pasaje bíblico, restablecer lección y posición sin perder respuestas. Una lección completada sigue accesible para revisar sin reiniciar avance.

No crear inputs “Nombre/Fecha” o una casilla nueva de conversión/copiar decisión sólo porque aparecen en el adjunto. No recopilar datos de fe personales ni enviarlos a analítica.

Archivos: `StudyIndexPage.jsx`, `StudyLessonPage.jsx`, módulos de estilos existentes y componentes presentacionales nuevos `StudyHero.jsx`/`StudyLessonHeader.jsx` si reducen duplicación. Las funciones de progreso, evaluación y contenido sólo se tocan si un defecto probado lo exige. La [atribución del contenido](../../src/content/la-fe-de-jesus/README.md) debe permanecer accesible; no extrapolar la licencia de material textual al arte de una portada distinta.

## 7. Biblioteca: fuente primero, lector después

La investigación distingue tres cosas: acceso gratuito, licencia de código de un repositorio y permiso para redistribuir una traducción. No son equivalentes. La autoría antigua de Ellen G. White no demuestra por sí sola que una edición española moderna sea incorporable.

Decisión inicial: **El Camino a Cristo** como MVP; **El Deseado de todas las gentes** como segunda importación sobre el mismo lector. Ambos sujetos a fuente íntegra y derechos de la edición documentados. Ver informe de biblioteca adjunto; los repos encontrados aún no cumplen ese contrato.

Crear primero `docs/content-sources/egw.md` con una fila por edición: título, autor, traductor/editorial si constan, año, idioma, URL fuente, formato, titular/licencia o evidencia de dominio público aplicable, condiciones, fecha de verificación y decisión. No copiar corpus sólo para ver cómo queda el lector. Ausencia de `LICENSE` o licencia MIT del scraper no autoriza el texto.

Si no se obtiene edición válida, Luna puede completar catálogo útil con enlaces explícitos “Leer en EGW Writings”, y registrar **lector interno pendiente de fuente**. No mostrar una página de lectura vacía ni vender el enlace externo como una experiencia interna terminada. Mantenerla visualmente secundaria en Home; la primera tarjeta continúa siendo Biblia.

Con fuente válida, rutas propuestas: `/library`, `/library/:bookSlug`, `/library/:bookSlug/:chapterSlug`. No reutilizar `/bible` ni `/read/:book/:chapter` para libros no bíblicos; los IDs numéricos y contratos de enlaces bíblicos deben seguir intactos.

Modelo de texto preparado por capítulo:

```text
Book: id, slug, title, author, language, edition, sourceUrl, rights,
      contentVersion, coverAsset, chapters[{id,slug,title,order}]
Chapter: bookId, chapterId, blocks[{id,type:'heading'|'paragraph',text}], notes[]
```

IDs de párrafos deterministas de la edición, no índices regenerados que invaliden posiciones. Conservar puntuación, notas y títulos; importer reproducible con SHA-256 de origen, inventario de capítulos y auditoría de omisiones. No ejecutar HTML descargado ni usar `dangerouslySetInnerHTML` sobre una fuente arbitraria. Guardar capítulo por archivo JSON y carga diferida; no meter el libro completo en el bundle ni la búsqueda bíblica.

Lector: encabezado con libro y capítulo, índice accesible, texto, anterior/siguiente, tamaño de letra y tema. Compartir ruta a capítulo/párrafo, no fabricar versículos. Progreso separado `santa_biblia_v2_library`, versionado por edición y libro; restaurar párrafo y proporción dentro de él, con fallback al inicio si ya no existe. No sobrescribir `santa_biblia_v2_reading`, guardados bíblicos ni progreso del curso.

Offline: capítulos visitados bajo el caché de datos existente, con política explícita; descarga completa optativa sólo una vez aprobado el contenido. Avisar si no está disponible offline. Cambiar versión de contenido invalida únicamente la caché de esa edición.

Archivos previstos: `src/features/library/LibraryPage.jsx`, `BookIndexPage.jsx`, `BookReaderPage.jsx`, `libraryRepository.js`, `libraryProgress.js`, `data/catalog.json`, `public/data/library/<book>/<version>/<chapter>.json`, `scripts/import-library-book.mjs`. No construir esta infraestructura antes de cerrar la fuente o elegir explícitamente la modalidad de catálogo externo.

## 8. Etapas pequeñas y verificables

Cada etapa tiene un commit propio cuando pase sus comprobaciones. No reescribir las etapas siguientes para resolver un detalle de la actual. Crear rama `codex/experiencias-lectura` desde la base compartida salvo instrucción posterior del usuario. El encargo futuro es implementar localmente; publicación se rige por la autorización vigente al ejecutar, sin inventar una aprobación adicional si ya existe.

| Etapa | Trabajo, orden y archivos | Criterio para cerrar |
|---|---|---|
| **0A · Base** | Leer `git status`, este plan y fuentes. Registrar commit inicial, capturas actuales y resultados previos. No borrar cambios del usuario. | Base reproducible; fuentes externas y flags identificados; no repetir auditoría total sin cambios. |
| **0B · Búsqueda pendiente** | En `searchEngine.js`, eliminar el corte silencioso a 100 mediante paginación/“Ver más” con total; compartir contrato en SearchPage y BibleNavigator. Coincidencia por palabras completas normalizadas, todas las palabras de la frase; no sinónimos automáticos. | “mundo” no devuelve “inmundo”; una frase con palabras separadas sí coincide; más de 100 resultados accesibles; consulta nueva/clear descarta resultados viejos. |
| **1 · Tarjeta principal** | Cambios locales `HomePage.jsx/.module.css` e i18n. Centrar fila móvil completa; colores suaves; ambos estados; eventual retoque mínimo al hero. | Capturas 320/390/768/1440 px y ambos temas. Botones iguales, centrados, etiquetas completas; retorno y selector intactos. |
| **2 · Arte e identidad** | Producir artes RPSP/curso y variantes locales; registrar procedencia. Aplicar a tarjetas manteniendo destinos actuales hasta existir las nuevas páginas. | Arte reconocible y legible, recortes correctos, presupuesto de peso; ninguna ruta rota ni texto horneado. |
| **3A · Resolver audio** | RSS→metadata; adapter, endpoint, middleware dev, fixtures, caché/fallback, calendario y cambios de día. | Metadata real de 10/09/2026 coincide con Salmos 34; missing/duplicate/error no emparejan otro capítulo; endpoint sirve JSON. |
| **3B · Player** | `DailyAudioPlayer` aislado, estados y controles; fuente externa directa. | Reproducción/pausa/seek/error en navegador; un solo audio; ausencia de descargas/proxy/precache propios. |
| **3C · Reavivados** | `DailyReadingPage`, texto del día, navegación/footer, ruta y enlace Home. | Sólo audio+capítulo como centro; texto funciona sin audio; no siguiente capítulo; tema/tamaño/fecha coherentes. |
| **4A · Explorar temas** | Índice/buscador/filtros, `topicSearch.js`, navegación hacia ficha. | Cualquier situación alcanzable; 13/92 datos conservados; query y filtros reflejados en URL. |
| **4B · Leer tema** | Ficha por situación, compatibilidad de enlaces, regreso lector, variantes de pasaje. | Pasaje central inmediato, complementarias manejables, retorno exacto; curso no cambia por CSS compartido. |
| **5A · Índice del curso** | Hero de curso, acción de continuar y recorrido de 20 lecciones. | Misma progresión; aspecto propio; claro nuevo usuario/usuario con avance. |
| **5B · Lecciones** | Encabezado y composición del estudio, papel/azul/ocre, test final. | Evaluaciones/lectura/desbloqueo/retorno y progreso persistente conservados. |
| **6A · Biblioteca y derechos** | Cerrar fuente de una edición; decidir interna o enlaces oficiales; registrar evidencia. | Go/no-go por libro sin confundir licencia de código con texto. No bloquea etapas 1–5. |
| **6B · Lector de libro** | Sólo con fuente válida: importar Camino a Cristo, catálogo/índice/lector/progreso separado. | Texto íntegro auditado, URL por capítulo, continuidad, accesibilidad y offline comprobados. |
| **6C · Segundo libro** | Incorporar Deseado sólo si cumple la misma fuente/contrato y no exige otro lector. | Misma QA; ninguna paráfrasis como sustituto del original. |
| **7 · Integración** | Navegación, i18n, presupuestos de carga, screenshots finales, regresión y registro. | Checks pertinentes verdes, pendientes externos visibles y publicación descrita con precisión. |

Dependencias: 1 independiente; 2 puede prepararse en paralelo con 3A; 3C depende de 3A/B; 4 y 5 comparten riesgo `TopicPassage` y deben integrarse secuencialmente; 6B depende de 6A. No ampliar base de datos, autenticación, transcripción, comentarios sociales ni sistema de cursos completo.

## 9. Verificación y casos de aceptación

Pruebas existentes: `e2e/home-reading-flow.spec.js`, `mobile-navigation.spec.js`, `reading-flow.spec.js`, `study-flow.spec.js`, tests del calendario, búsqueda, progreso y contenido. Al cambiar el destino de RPSP, actualizar expectativas `/read/...` a `/reavivados` en las pruebas de Home y navegación; no eliminar esas comprobaciones. Mantener prueba de las dos columnas y scroll independiente del selector.

Añadir pruebas nuevas sólo para comportamiento real:

- **Home:** centro del grupo de acciones coincide con centro interior de tarjeta (tolerancia 1 px), ancho/alto iguales, 320 px sin recorte, primer usuario elige libremente; hero con promesa larga no solapa tarjeta.
- **RSS/fecha:** fixtures de episodio válido, sin `enclosure`, HTML escapado, publicación de otro día, doble entrada, Salmo 34 vs 134, cambio de año y horario de verano. Fecha local Chile vs UTC a medianoche. No aceptar fuera del calendario como el último día del año etiquetado “hoy”.
- **Audio:** simular eventos del medio para play rechazado, seek no disponible, duración desconocida, red caída, desmontaje y cambio de episodio. E2E con metadata interceptada determinista; prueba manual del enlace real para reproducción/Range. No depender de Nuevo Tiempo para que CI siempre pase.
- **Reavivados:** sin audio hay capítulo y fallback; si falla capítulo hay reintento de capítulo separado; el lector no monta dos navbars y el footer queda accesible. No se crea un índice masivo ni lista de capítulos.
- **Temas:** búsqueda sobre catálogo completo, combinación visible de consulta/filtro y salida del estado vacío, rutas antiguas y nuevas, vuelta desde Biblia con query/hash, ID inexistente. Comparar catálogo antes/después.
- **Curso:** las tres preguntas finales, errores y reintentos, confirmación de lectura, desbloqueo, lección ya completada, progreso al recargar y volver desde referencia. Comparar slugs y preguntas antes/después.
- **Biblioteca:** importación reproducible, primer/último capítulo, continuidad de párrafo, localStorage no disponible, fuentes accesibles, sólo si la etapa interna se habilita.

Matriz visual final: 320×568, 390×844, 768×1024 y 1440×900; claro/oscuro; texto aumentado. Safari/iOS y Android/Chrome para audio real. Si no hay dispositivo real, registrar emulación como emulación, no como prueba de hardware.

Comandos por etapa: lint y tests concretos de lo modificado. Al integrar, una pasada de `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build`, `git diff --check`. El build ya ejecuta auditorías de contrato público/corpus: no eliminarlas para acomodar la nueva sección. Una vez verdes, repetir sólo lo justificado por cambios o fallos posteriores.

Rendimiento: rutas nuevas con `lazy`, audio fuera del bundle/cache PWA, fuente RSS fuera del navegador, imágenes adaptadas y lazy cuando están debajo del primer contenido visible. Comparar requests/bytes con la base; no atribuir mejora de bounce rate sólo a esta entrega. No enviar texto de búsqueda, respuestas del curso, progreso de fe o nombres de situaciones a Analytics.

## 10. Entregables de Luna y estado de ejecución

Por etapa, actualizar `docs/implementation/ESTADO_EXPERIENCIAS_LECTURA.md`: etapa, commit, archivos principales, comportamiento entregado, pruebas exactas, capturas y bloqueos concretos. Diferenciar **implementado**, **verificado** y **publicado**. No declarar audio diario completo porque una sola URL reproduzca; no declarar libros abiertos porque un repositorio sea público.

Entregar capturas de Home con/sin historial; Reavivados con audio listo, ausencia y reproducción; explorador/ficha temática; índice/lección del curso; biblioteca según modalidad habilitada. Guardar evidencia en ruta durable y linkearla; las capturas temporales originales del usuario no estarán garantizadas en otro worktree.

Paquete de fuentes complementario: `SOURCES_AUDIO_RPSP.md`, `SOURCES_BIBLIOTECA_EGW.md`, `AUDIT_UX.md` en esta carpeta. Estos documentos registran lo encontrado; las decisiones ejecutables de este plan prevalecen sobre propuestas alternativas de los informes. Un permiso aún no verificado no se convierte en permiso al copiarlo al plan.

### Prompt para iniciar la etapa 1 con Luna

> Lee `docs/implementation/PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md`. Ejecuta 0A y etapa 1; deja 0B y las demás etapas registradas para continuación. Centra los dos botones de la primera tarjeta respecto de toda la tarjeta en móvil; texto exacto “Continuar leyendo” y “Elegir una lectura”, mismo tamaño, tonos azules suaves integrados al Home. Sin historial, sólo elegir lectura. Conserva el hero y haz únicamente el retoque limitado permitido si aporta una mejora comprobable. Trabaja sobre el estado real del checkout, preserva cambios y progreso, ejecuta las pruebas pertinentes y entrega capturas claro/oscuro móvil/escritorio. Actualiza el registro de ejecución. No implementes audio, temas, curso ni biblioteca en esta primera etapa y no declares terminadas las etapas siguientes. Para publicar, sigue la autorización de la tarea en la que se te entregue este encargo.

Las siguientes ejecuciones indican el número exacto de etapa y reutilizan este mismo documento. Luna no tiene que decidir la arquitectura ni volver a redactar el plan.
