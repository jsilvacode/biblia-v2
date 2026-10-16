# Santa Biblia: consistencia, confianza y uso cotidiano

Fecha: 16 de octubre de 2026.

## Forma de trabajo

Cada etapa termina con comprobaciones proporcionales, un commit en `main`, push a `origin/main` y verificación del despliegue público. La etapa siguiente no comienza a modificar código hasta que la anterior esté publicada. Las auditorías de solo lectura pueden hacerse en paralelo.

Conservar la identidad editorial: tipografía de lectura, papel cálido, acentos coral y azul, paisaje y vidrio en la portada. Hacer visibles las acciones, mantener controles táctiles cómodos y ofrecer recuperación de errores. Evitar pantallas o funciones anunciadas que todavía no existen.

## Etapas

| Etapa | Mejora concreta | Criterio de cierre | Estado |
| --- | --- | --- | --- |
| 1 | Guardados conserva la traducción del versículo | Guardar y destacar en una versión, cambiar la preferencia y abrir ambos desde Guardados conserva el texto y la marca originales | Completado |
| 2 | Guardar y destacar confirman persistencia real | Un fallo de almacenamiento muestra un mensaje, permite reintentar y no presenta un éxito falso ni sobrescribe datos no cargados | Pendiente |
| 3 | Recuperación de carga y actualizaciones | Las rutas fallidas ofrecen reintento; las actualizaciones se consultan oportunamente y no fuerzan bucles ni interrumpen una acción abierta | Pendiente |
| 4 | Lenguaje visual y navegación compartidos | Controles, foco, tamaños táctiles y acciones equivalentes usan un patrón coherente en las páginas principales | Pendiente |
| 5 | Flujos de lectura más evidentes | Retomar es fácil de encontrar; las acciones del versículo se descubren y priorizan copiar/guardar; «Inicio del capítulo» no se confunde con Inicio del sitio; los modales conservan contexto | Pendiente |
| 6 | Footer útil y cierre editorial | Identidad, ayuda sobre el proyecto, contacto y apoyo tienen una jerarquía clara; enlaces táctiles cómodos y una página informativa real | Pendiente |
| 7 | Primera búsqueda y trabajo repetido | Se reutiliza preparación del índice entre instancias sin mezclar consultas/versiones; carga diferida y recuperación se mantienen; se compara el trabajo antes/después | Pendiente |
| 8 | Verificación de la experiencia completa | Recorridos principales en móvil/tablet/escritorio, teclado, dos temas y errores relevantes; correcciones puntuales y limpieza de lo sustituido | Pendiente |

## Comprobaciones comunes

- Interfaz y mensajes en español, inglés y portugués.
- No introducir pasos extra para elegir libro/capítulo o seguir leyendo.
- Respetar la posición de lectura y el retorno a guías/estudios.
- Probar red/almacenamiento fallidos cuando la etapa afecta esas rutas.
- Mantener alcance revisable: sin reescrituras ni dependencias nuevas sin necesidad.

## Registro de publicaciones

1. Guardados conserva la traducción: pruebas E2E en móvil y escritorio, lint y build aprobados. Publicación en el commit que incorpora este plan.
