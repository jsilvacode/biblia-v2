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
| 7 | Footer útil y cierre editorial | Identidad, ayuda sobre el proyecto, contacto y apoyo tienen una jerarquía clara; enlaces táctiles cómodos y una página informativa real | Pendiente |
| 8 | Primera búsqueda y trabajo repetido | Se reutiliza preparación del índice entre instancias sin mezclar consultas/versiones; carga diferida y recuperación se mantienen; se compara el trabajo antes/después | Pendiente |
| 9 | Verificación de la experiencia completa | Recorridos principales en móvil/tablet/escritorio, teclado, dos temas y errores relevantes; correcciones puntuales y limpieza de lo sustituido | Pendiente |

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

6. Home editorial — tarjetas alineadas y enlaces compactos; panel cálido más sólido en día/noche; paisaje propio con encuadre panorámico y vertical, variantes AVIF/WebP sin ampliación artificial y velo localizado para el texto. Doce E2E de composición/idiomas y dos de descarga única, revisión visual en ambos temas a 390/768/1440 px, lint y build aprobados. Prompts y tamaños en `HOME_LANDSCAPE_2026-10-16.md`.
