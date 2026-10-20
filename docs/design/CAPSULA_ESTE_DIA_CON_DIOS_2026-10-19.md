# Cápsula diaria: Este Día con Dios

Investigación realizada el 19 de octubre de 2026. La propuesta se implementó posteriormente ese día; el estado y la validación están en [la nota de implementación](../implementation/CAPSULA_DIARIA_2026-10-19.md).

## Alcance solicitado

Incorporar la cápsula diaria de Este Día con Dios en el inicio, después del hero y antes de «También en Santa Biblia». Reproducir desde YouTube, acreditar al creador y ofrecer un botón para compartir una URL de Santa Biblia que abra esa misma cápsula. Añadir un acceso discreto a videos anteriores.

## Origen comprobado en vivo

El sitio es WordPress y publica una página por cápsula. Su portada asocia explícitamente día/mes, número de cápsula, iframe de YouTube y enlace permanente completo. La comprobación se hizo contra el sitio en vivo y su API; la copia del buscador estaba desactualizada.

| Fecha editorial | Cápsula | ID de YouTube | Post de WordPress |
| --- | --- | --- | --- |
| 2026-10-19 | #292 No depende solo de nosotros | `PbyYEJDJFwg` | `3202` |
| 2026-10-18 | #291 Separados para representar | `mJmZNM0AHzA` | `3201` |
| 2026-10-17 | #290 Probando la Palabra | `-1l4aNoFduQ` | `3210` |

La [publicación del 19 de octubre](https://estediacondios.com/2026/10/19/292-no-depende-solo-de-nosotros-i-este-dia-con-dios-pr-jorge-rampogna/) contiene directamente `https://www.youtube.com/embed/PbyYEJDJFwg?controls=0`. El servicio público oEmbed de YouTube devuelve el mismo título, una miniatura y el creador «Este Día con Dios», con enlace a [@EsteDiaConDios](https://www.youtube.com/@EsteDiaConDios). El presentador figura en el título: Pr. Jorge Rampogna.

La [API pública de publicaciones](https://estediacondios.com/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc) entrega fecha, título, ID y enlace, sin autenticación. **El cuerpo del post está vacío en la API y el ID del video no aparece entre los campos públicos de la respuesta completa comprobada.** Por tanto, la solución requiere consultar también el HTML de la página individual para extraer el iframe.

Se probó una [consulta por fecha anterior](https://estediacondios.com/wp-json/wp/v2/posts?after=2026-10-18T00%3A00%3A00&before=2026-10-18T23%3A59%3A59&_fields=id,date,date_gmt,link,title&per_page=5), que devolvió correctamente el post `3201` del 18 de octubre. Este mecanismo permite recuperar anteriores sin recorrer las páginas visuales del sitio.

El [feed del canal](https://www.youtube.com/feeds/videos.xml?channel_id=UC0q_hZogIU7r_rFrCT9chrQ) también responde. En esta consulta contenía 15 entradas; esa cantidad es una observación, no una garantía de archivo. Además, las cápsulas #293 y #294 aparecían publicadas el 16 de octubre, mientras #292 tenía publicación en YouTube el 19. **La fecha de subida y el orden de YouTube no bastan para seleccionar la cápsula del día.**

## Solución recomendada

Usar el calendario editorial de la web oficial para elegir la cápsula y YouTube para reproducirla. Esta primera integración puede funcionar sin una clave de YouTube Data API y sin un despliegue nuevo cada día.

1. La app determina la fecha civil del lector, siguiendo el comportamiento actual de Reavivados, y consulta un endpoint propio: `/api/daily-video?date=2026-10-19` —nombre propuesto—.
2. El servidor consulta las publicaciones de esa fecha en WordPress y comprueba la fecha del post y del enlace permanente. Si no hay coincidencia única, devuelve un estado explícito en lugar de elegir arbitrariamente.
3. El servidor obtiene el HTML de la publicación elegida y extrae exclusivamente un ID válido de un iframe de YouTube. No inserta HTML, scripts, reproductores de terceros ni botones de compartir del sitio de origen en nuestra página.
4. Devuelve JSON con `contentDate`, `sourcePostId`, `episodeNumber`, `title`, `videoId`, `sourcePageUrl`, créditos, fecha de comprobación y procedencia. Se validan dominios, redirecciones, formato del ID, tamaño de respuesta y tiempos de espera.
5. Nuestra interfaz construye el reproductor oficial a partir del ID. Las consultas se comparten y cachean en servidor/CDN, siguiendo el precedente de `/api/rpsp`.

Propuesta inicial de caché: 15 minutos para una coincidencia confirmada y 2 minutos para ausencia de publicación. Los fallos transitorios no deben almacenarse durante horas. Una consulta por fecha permite actualizar automáticamente la cápsula sin cron obligatorio: la primera visita tras vencer la caché vuelve a comprobar el origen.

La memoria de una función serverless no es un archivo duradero. La consulta histórica por fecha permite un prototipo sin servicios adicionales. Para la versión pública con enlaces que conserven la cápsula compartida, recomiendo persistir la asociación verificada `contentDate → sourcePostId → videoId` y sus metadatos, y revalidar disponibilidad sin sustituir silenciosamente el episodio. Esto también permite responder durante una caída del origen. La persistencia no garantiza que un video eliminado por su creador siga siendo reproducible.

El feed de YouTube puede servir para comprobar un `videoId` previamente confirmado o como apoyo cuando existe una vinculación verificable con la publicación oficial. Un número editorial aislado puede repetirse entre años o series: no alcanza para elegir un video de respaldo. Sin una asociación confirmada, conservar el estado de indisponibilidad. Un archivo completo directamente desde YouTube exigiría evaluar su Data API y la playlist de subidas; no aporta una ventaja clara para la primera versión.

## Fecha y disponibilidad

`contentDate` representa el día editorial y debe conservarse como `YYYY-MM-DD`, separado de los instantes de publicación. Por ejemplo, WordPress devuelve `2026-10-19T01:00:00` como fecha y GMT para el episodio de hoy: convertido al horario de Santiago cae en la noche del 18. Esa conversión no debe cambiar la cápsula del 19 a la del 18.

No se ha comprobado un horario contractual de publicación. Las horas observadas en WordPress y YouTube difieren. Deben contemplarse estados de carga, publicación pendiente, error del proveedor, reproducción no disponible y falta de conexión.

Si falta la cápsula de hoy, indicar «La cápsula de hoy aún no está disponible» y permitir abrir la última publicada con su fecha visible. Si se ofrece directamente una anterior, rotularla «Última cápsula disponible · [fecha]». Nunca etiquetarla como la de hoy. Al volver a la app y al cambiar de día se actualiza la consulta; una reproducción activa no debería interrumpirse por el cambio de fecha.

## Experiencia propuesta

- Primera sección de `homeFeed`, después del bloque de apertura y antes de la invitación de instalación y «También en Santa Biblia».
- Nombre «Este Día con Dios», fecha y título; portada con botón de reproducción. Crear el iframe al activarlo para reducir trabajo y conexiones en la carga inicial del inicio. No iniciar sonido al entrar en Home.
- Reproductor adaptable, controles disponibles, reproducción dentro de la página en móvil y pantalla completa. Respetar el mínimo de 200 × 200 px documentado por YouTube incluso en pantallas estrechas.
- Crédito visible: «Este Día con Dios · Pr. Jorge Rampogna», con enlaces al sitio y al canal oficial. Usar la autoría verificada de cada episodio si cambia el presentador.
- Botón propio «Compartir» junto al reproductor. Comparte el enlace de Santa Biblia; las acciones internas del iframe siguen perteneciendo a YouTube.
- «Videos anteriores» despliega primero una lista breve de siete días con fecha, título y miniatura. Solo se mantiene un reproductor activo. Las fechas anteriores se obtienen del catálogo público y cada selección abre su URL estable; no se crean varios iframes a la vez.
- Enlace permanente «Ver en YouTube» como alternativa si el reproductor no está disponible. La reproducción requiere conexión; no guardar el audiovisual en el service worker.

## Enlace compartible y vista previa

Ruta propuesta: `https://www.santabiblia.cloud/este-dia-con-dios/2026-10-19`. Debe abrir una página enfocada en la cápsula de esa fecha, reutilizando el mismo componente del inicio, con acceso de retorno a Inicio y a anteriores.

Compartir siempre utiliza la fecha del episodio que se está mostrando. Abrir el enlace al día siguiente debe seguir mostrando la misma cápsula. Un enlace solo al inicio o a `#video-del-dia` cambiaría de contenido y no cumple ese comportamiento.

La nueva ruta necesita una reescritura anterior al fallback de la SPA y metadatos HTML generados en servidor —título, descripción, miniatura, URL canónica y crédito—, para que WhatsApp y otras aplicaciones obtengan una vista previa sin ejecutar React. La aplicación receptora controla la presentación final. Se puede reutilizar el mecanismo de `api/share-page.js`, añadiendo un tipo de contenido para cápsulas.

El HTML social debe tener un presupuesto breve de consulta y priorizar metadatos ya confirmados. Si el origen falla y no hay respaldo, servir la página funcional con una tarjeta genérica y `Cache-Control: no-store`, siguiendo el tratamiento actual de errores del endpoint. Evitar que una ausencia temporal almacene durante días una vista previa incorrecta.

## Encaje en el repositorio

| Archivo actual | Trabajo al implementar |
| --- | --- |
| `src/features/home/HomePage.jsx` | Insertar el módulo antes del resto del contenido de `homeFeed`. |
| `src/features/home/HomePage.module.css` | Espaciado con la sección siguiente; estilos del recurso en su propio módulo. |
| `src/app/routes.jsx` | Ruta por fecha y página de cápsula. |
| `api/rpsp.js` y `api/_lib/rpspFeed.js` | Referencias para consulta acotada, validación y caché; resolver nuevo independiente. |
| `src/features/reader/shareVerse.js` | Reutilizar o extraer compartir/copiar; construir una URL propia del nuevo recurso. |
| `api/share-page.js` y `api/_lib/shareMetadata.js` | HTML social por episodio, conservando el funcionamiento de versículos. |
| `vercel.json` | Endpoint y ruta pública antes del fallback; exclusiones de archivos de la función. |
| `vite.config.js` | Endpoint de desarrollo y preview; revisar tratamiento de metadatos sin conexión. |
| `src/i18n/locales/{es,en,pt-BR}.js` | Traducir controles y estados; identificar el contenido hablado como español. |

La política de referencia del despliegue ya es `strict-origin-when-cross-origin`, compatible con la identificación que pide YouTube. Mantenerla también en el iframe. `X-Frame-Options: DENY` protege nuestras páginas frente a ser embebidas; no impide incluir YouTube dentro de ellas.

## Comprobaciones al implementar

Probar fecha exacta frente a videos subidos por adelantado, cambio de día y zona horaria, año nuevo y fechas inválidas; API con contenido vacío, ausencia o duplicados, HTML cambiado y proveedor caído; un permalink de ayer abierto mañana; compartir/copiar y vista previa por fecha; móvil, teclado, temas claro/oscuro y tamaño mínimo del reproductor. Un evento `load` del iframe no garantiza que el video sea reproducible; si queremos mostrar errores específicos de reproducción, usar los eventos de la IFrame API.

## Referencias oficiales

- [Sitio de origen](https://estediacondios.com/) y [API pública](https://estediacondios.com/wp-json/).
- [WordPress: publicaciones y consultas por fecha](https://developer.wordpress.org/rest-api/reference/posts/).
- [YouTube: parámetros y dimensiones del reproductor](https://developers.google.com/youtube/player_parameters).
- [YouTube: inserción y modo de privacidad mejorada](https://support.google.com/youtube/answer/171780?hl=es). Usar `youtube-nocookie.com`; no implica ausencia total de conexiones a Google.
- [YouTube: identificación del cliente y política Referer](https://developers.google.com/youtube/terms/required-minimum-functionality#api-client-identity-and-credentials).
- [YouTube: feed y notificaciones del canal](https://developers.google.com/youtube/data/guides/push_notifications).

La disponibilidad de los endpoints y el contenido descrito corresponden a la comprobación del 19 de octubre de 2026; no son un contrato de estabilidad del proveedor.
