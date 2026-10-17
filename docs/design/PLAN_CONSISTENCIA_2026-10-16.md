# Santa Biblia: consistencia, confianza y uso cotidiano

Fecha: 16 de octubre de 2026.

## Forma de trabajo

Cada etapa termina con comprobaciones proporcionales, un commit en `main`, push a `origin/main` y verificación del despliegue público. La etapa siguiente no comienza a modificar código hasta que la anterior esté publicada. Las auditorías de solo lectura pueden hacerse en paralelo.

Conservar la identidad editorial: tipografía de lectura, papel cálido, acentos coral y azul, paisaje y panel de lectura en la portada. Hacer visibles las acciones, mantener controles táctiles cómodos y ofrecer recuperación de errores. Evitar pantallas o funciones anunciadas que todavía no existen.

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
| 10 | Base definida entre apertura y cuerpo | Panel sólido con bordes nítidos; paisaje de apertura termina horizontalmente a la altura de la base del selector y enlaza con el color del cuerpo; conservar contenido y posición | Completado |
| 11 | Footer compacto y tres modales informativos | Acerca de, Ayuda y Apoya el proyecto abren contenidos separados, centrados y con X; conservan foco y posición. Contacto dentro de Acerca de, pagos dentro de Apoya; /about conserva enlaces directos existentes | Completado |
| 12 | Selector unido al cuerpo | Panel opaco sin contorno marcado, redondeado solo arriba; base recta del mismo color del cuerpo en día/noche, sin alterar márgenes, contenido ni posiciones | Completado |
| 13 | Resaltado temporal fiable | El pulso de atención termina aun si se demora el RAF; una URL sin intención de atención no lo activa por comparar claves vacías; conserva destacados permanentes | Completado |

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

9. `3133d1c` — Accesibilidad y limpieza — hero sin desbordes y modales con cierres y espacio de lectura útiles a texto 200%; palabras largas del comentario se ajustan. Retirados estilos sustituidos y tres textos sin consumidores. 260 unitarias, regresión completa de 219 E2E aprobadas (19 omisiones por plataforma), seis E2E de zoom y tres WebKit; lint, build y auditoría de corpus aprobados. Recorridos públicos en móvil oscuro y escritorio claro: búsqueda/lectura/guardado/retomar/ayuda/modal; una imagen de paisaje incluso al instalar el SW.

La prueba final con SW real también conserva modal, foco y posición en la segunda pestaña y recarga una sola vez únicamente la que solicita actualizar. Las dos publicaciones adicionales conservan estos cambios y se verifican por separado.

10. `86a7bd2` — Base de apertura definida — panel opaco con borde y radio limpio, sin desenfoque, máscaras ni reflejos. Fotografía y velo terminan exactamente en su base; las coordenadas y dimensiones de hero/panel/selector/editorial se mantienen. Catorce E2E, geometría y revisión visual en 320/768/1440 px y ambos temas, lint y build aprobados.

## Ajustes del 17 de octubre

Los tres destinos del footer se abren como modales independientes para conservar el contexto de lectura. Acerca de reúne identidad y contacto; Ayuda muestra sus cinco temas con desplazamiento interno cuando sea necesario; Apoya el proyecto contiene las opciones de donación. Mantener una X superior derecha, cierre con Escape y devolución del foco al control que abrió cada ventana. La página /about permanece como destino directo compatible.

Después de publicar los modales, refinar la unión del selector con el cuerpo: conservar radio solo en las esquinas superiores, retirar el contorno visible y terminar la superficie opaca con el mismo color del cuerpo y una base horizontal.

11. `37580d8` — Footer compacto y tres modales — contenidos separados de Acerca de/contacto, Ayuda y Apoya; reutilizados con la página /about y sus anclas. Siete E2E y una omisión esperada, 260 unitarias, lint/build/corpus aprobados; geometría y cierres revisados en ambos temas a 320 px con texto 200 %, 390/768/1440 px. Artefacto y recorridos públicos verificados: búsqueda, lectura, guardado, retomar, tres modales y cita temática, con foco/posición conservados.

La regresión posterior detectó una carrera entre RAF y temporizador del pulso de atención. Se verificó el orden invertido con el efecto real: el temporizador puede terminar antes de la activación. Corregir en una publicación separada, junto con la comparación de claves vacías que activa indebidamente el pulso de una URL directa.

12. `31c7e1e` — Selector unido al cuerpo — relleno opaco del mismo tono, sin contorno y redondeado solo arriba; base horizontal recta. Treinta E2E, comparación de geometría en 320/768/1440 px y dos temas, lint/build/corpus aprobados; verificado el artefacto público. Normalizadas dos mediciones de pruebas: cero negativo al recuperar scroll y lectura atómica de las coordenadas del cierre de popovers.

13. Resaltado temporal fiable — el temporizador comienza después de la activación y se cancelan ambos recursos al salir; una clave vacía no produce un pulso permanente. Dos pruebas E2E nuevas reprodujeron ambos defectos en navegador real antes del arreglo y pasaron después, manteniendo los destacados guardados. Ocho E2E focalizadas y regresión final de 223 E2E aprobadas (19 omisiones esperadas por plataforma), lint/build/corpus aprobados.

El acabado y los tres modales de las etapas 11–12 también pasaron los recorridos públicos de búsqueda, lectura, guardado y retomar, en móvil oscuro y escritorio claro; conservan foco y posición, y descargan una sola variante del paisaje.
