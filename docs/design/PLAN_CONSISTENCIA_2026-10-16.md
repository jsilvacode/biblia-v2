# Santa Biblia: consistencia, confianza y uso cotidiano

Fecha: 16 de octubre de 2026.

## Forma de trabajo

Cada etapa termina con comprobaciones proporcionales, un commit en `main`, push a `origin/main` y verificación del despliegue público. La etapa siguiente no comienza a modificar código hasta que la anterior esté publicada. Las auditorías de solo lectura pueden hacerse en paralelo.

Conservar la identidad editorial: tipografía de lectura, papel cálido, acentos coral y azul, paisaje y vidrio en la portada. Hacer visibles las acciones, mantener controles táctiles cómodos y ofrecer recuperación de errores. Evitar pantallas o funciones anunciadas que todavía no existen.

## Etapas

| Etapa | Mejora concreta | Criterio de cierre | Estado |
| --- | --- | --- | --- |
| 1 | Guardados conserva la traducción del versículo | Guardar y destacar en una versión, cambiar la preferencia y abrir ambos desde Guardados conserva el texto y la marca originales | Completado |
| 2 | Guardar y destacar confirman persistencia real | Un fallo de almacenamiento muestra un mensaje, permite reintentar y no presenta un éxito falso ni sobrescribe datos no cargados | Completado |
| 3 | Recuperación de carga y actualizaciones | Las rutas fallidas ofrecen reintento; las actualizaciones se consultan oportunamente y no fuerzan bucles ni interrumpen una acción abierta | Completado |
| 4 | Lenguaje visual y navegación compartidos | Controles, foco, tamaños táctiles y acciones equivalentes usan un patrón coherente en las páginas principales | Completado |
| 5 | Flujos de lectura más evidentes | Retomar es fácil de encontrar; las acciones del versículo se descubren y priorizan copiar/guardar; «Inicio del capítulo» no se confunde con Inicio del sitio; los modales conservan contexto | Completado |
| 6 | Home editorial y paisaje | Tarjetas alineadas bajo hero/selector, enlaces de interés compactos, superficie más sólida día/noche; paisaje propio optimizado con luz y recorte que permitan leer sin perder el paisaje; conservar posiciones y flujos actuales | Completado |
| 7 | Footer útil y cierre editorial | Identidad, ayuda sobre el proyecto, contacto y apoyo tienen una jerarquía clara; enlaces táctiles cómodos y una página informativa real | Completado |
| 8 | Primera búsqueda y trabajo repetido | Se reutiliza preparación del índice entre instancias sin mezclar consultas/versiones; carga diferida y recuperación se mantienen; se compara el trabajo antes/después | Completado |
| 9 | Verificación de la experiencia completa | Recorridos principales en móvil/tablet/escritorio, teclado, dos temas y errores relevantes; correcciones puntuales y limpieza de lo sustituido | Completado |

| 10 | Base definida entre apertura y cuerpo | Panel sólido con bordes nítidos; paisaje de apertura termina horizontalmente a la altura de la base del selector y enlaza con el color del cuerpo; conservar contenido y posición | Pendiente |
| 11 | Footer compacto y apoyo en Acerca de | Solo Acerca de, Ayuda y Apoya el proyecto bajo la identificación; contacto y donaciones dentro de la página dedicada con anclas funcionales | Pendiente |

## Comprobaciones comunes

- Interfaz y mensajes en español, inglés y portugués.
- No introducir pasos extra para elegir libro/capítulo o seguir leyendo.
- Respetar la posición de lectura y el retorno a guías/estudios.
- Probar red/almacenamiento fallidos cuando la etapa afecta esas rutas.
- Mantener alcance revisable: sin reescrituras ni dependencias nuevas sin necesidad.

## Registro de publicaciones

1. `a3a277c` — Guardados conserva la traducción: pruebas E2E en móvil y escritorio, lint y build aprobados. Verificado el mismo artefacto en el dominio público.
2. `805df30` — Persistencia confirmada y recuperación: 22 pruebas unitarias, recorridos E2E de error/reintento y traducciones, lint y build aprobados. Verificado el mismo artefacto en producción.
3. `3d3a8a7` — Recuperación de rutas y actualización explícita: 225 pruebas unitarias, seis E2E, lint y build aprobados. Prueba con dos pestañas y SW real: la versión anterior recargaba ambas y cerraba el modal; la nueva recarga una vez solo la pestaña que lo solicita y conserva modal, foco y posición en la otra. Verificado el mismo artefacto en producción.
4. `7e69e5c` — Navegación y controles compartidos — configuración única de destinos, foco visible, superficies y acentos coherentes, objetivos táctiles de 44 px y etiquetas precisas en tres idiomas. Pruebas de navegación, lectura, traducción y responsive aprobadas; revisión visual a 320/768/1440 px; lint y build aprobados.

## Directriz editorial incorporada

Las referencias del 16 de octubre orientan la jerarquía, no son una maqueta literal: mantener hero y selector en su posición y conservar sus elementos. Dar a las tres entradas editoriales una fila común en desktop y un apilado cómodo en móvil, compactar los enlaces externos y evaluar una textura más sólida en ambos temas. Crear un paisaje inspirador con zonas de calma para el texto y encuadre útil en móvil; servir variantes comprimidas responsivas y aplicar el difuminado final en CSS. Evitar convertir fotografías a SVG o incrustar texto en la imagen.

5. `fee4750` — Flujos de lectura — «Continuar» y recientes antes de elegir/buscar, tres en escritorio y uno en móvil; ayuda inicial descartable y recordada; copiar/guardar primero; retorno único conserva el contexto. Ocho E2E Home, seis de descubrimiento/retorno y seis de guía, cinco unitarias de acciones, lint y build aprobados.

6. `b8a9017` + `893714d` — Home editorial — tarjetas alineadas y enlaces compactos; panel cálido más sólido en día/noche; paisaje propio con encuadre panorámico y vertical, variantes AVIF/WebP sin ampliación artificial y velo localizado para el texto. Doce E2E de composición/idiomas y dos de descarga única, revisión visual en ambos temas a 390/768/1440 px, lint y build aprobados. Prompts y tamaños en `HOME_LANDSCAPE_2026-10-16.md`.

7. `01ab6ba` — Footer y ayuda — identidad editorial, navegación informativa y contacto; apoyo secundario con objetivos de 44 px. `/about` ahora tiene contenido real y ancla de ayuda con foco/scroll correctos; explica traducciones, copiar/guardar, preparación offline y datos locales. Diez E2E de footer/rutas/ayuda/idiomas y dos unitarias de catálogos, lint y build aprobados.

8. `071da61` — Búsqueda reutilizable — un worker por pestaña, cancelación independiente, caché preparada acotada y reintento en las tres superficies. El recorrido medido pasa de tres workers/fetch/parseos/preparaciones a uno de cada; no es una medición de latencia. 260 unitarias, treinta E2E de búsqueda/reintento, contador real, lint y build aprobados. Reproducción en `SEARCH_REUSE_2026-10-16.md`.

## Ajuste solicitado al revisar el home publicado

Se incorporan dos publicaciones posteriores a la regresión en curso: retirar el difuminado del panel ahora sólido y cerrar la apertura con una base horizontal junto al selector; compactar después el footer a tres enlaces y trasladar las opciones de donación a Acerca de. La ayuda y el contacto siguen disponibles dentro de esa página. La referencia a una sección que termina junto al selector se interpreta como el fondo de apertura hero/selector mostrado en la captura, no como mover el pie del sitio al centro.

9. Accesibilidad y limpieza — hero sin desbordes y modales con cierres y espacio de lectura útiles a texto 200%; palabras largas del comentario se ajustan. Retirados estilos sustituidos y tres textos sin consumidores. 260 unitarias, regresión completa de 219 E2E aprobadas (19 omisiones por plataforma), seis E2E de zoom y tres WebKit; lint, build y auditoría de corpus aprobados. Recorridos públicos en móvil oscuro y escritorio claro: búsqueda/lectura/guardado/retomar/ayuda/modal; una imagen de paisaje incluso al instalar el SW.
