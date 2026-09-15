# Estado de ejecución — experiencias de lectura

Actualizado: 14 de septiembre de 2026. Encargo: [plan principal para Luna](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).

Actualización visual 14/09/2026: guía, mockups navegables, artes originales y capturas en [docs/design](../design/GUIA_VISUAL_LUNA_2026-09-10.md). Diseño preparado para revisión; las etapas de integración de la app continúan pendientes. Consultar el [reporte visual](../design/experiencias-lectura-v1/qa-report.json) para resultados de esta muestra, separados de las pruebas de la aplicación.

## Etapas 0A y 1 · primera tarjeta del Home

**Estado:** implementadas y verificadas en la rama `mejoras/lectura-principal`. La base inicial registrada fue `1dbd071`; no había cambios locales que preservar. Se identificaron las claves locales existentes `santa_biblia_v2_reading` para historial/progreso y `santa_biblia_v2_settings` para tema, idioma y preferencias. La etapa no depende de flags ni de fuentes externas.

**Implementado:** la tarjeta posterior al Hero conserva su arte editorial y el Hero sin cambios. Con historial muestra “Tu momento con la Palabra”, la referencia guardada, “Retoma tu última lectura.” y las acciones iguales “Continuar leyendo” y “Elegir una lectura”. Sin historial muestra “Comenzar a leer”, la invitación a elegir libro/capítulo y una única acción centrada “Elegir una lectura”. Ambas rutas reutilizan el progreso y el selector compartido existentes. La acción principal usa azul grisáceo y la secundaria azul neblina, con una variante de contraste específica en modo oscuro.

**Verificado:**

- `npm run lint`: aprobado.
- `npm run test`: 123 pruebas aprobadas.
- `npm run build`: aprobado; índice, contenido del curso, contrato público y corpus auditados.
- `npm run test:e2e`: 77 pruebas aprobadas y 13 omitidas por proyecto de dispositivo no aplicable.
- Prueba añadida: 320, 390, 768 y 1440 px; claro/oscuro; con/sin historial; igualdad de acciones, centrado móvil, ausencia de recorte y texto ampliado. La apertura del selector se comprueba explícitamente a 320 px.
- `git diff --check`: sin errores antes del cierre.

**Evidencia durable:** [capturas iniciales y finales](evidence/etapa-1-home/README.md). Incluye matriz de 16 combinaciones regulares y cuatro capturas con texto ampliado, generadas por `scripts/capture-home-stage1.mjs`. Es emulación Chromium, no validación en hardware físico.

**Siguiente etapa concreta recomendada:** **0B · Cobertura de búsqueda**. Es independiente, mejora la misma entrada al lector y responde al comportamiento pendiente de palabras/frases/resultados completos. No se inició en este cambio.

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
| 0B · Cobertura de búsqueda | Pendiente | Palabras completas y acceso a todos los resultados. |
| 1 · Primera tarjeta | Completada | Centrado móvil, tonos azules suaves y estados con/sin historial validados. |
| 2 · Arte | Assets y mockups preparados; integración pendiente | Aplicar WebP entregados siguiendo la guía y las capturas. |
| 3A · Fuente de audio | Investigación completada; integración pendiente | Endpoint RSS y fallback validado por fecha/referencia. |
| 3B · Reproductor | Pendiente | Player directo y pruebas reales de reproducción. |
| 3C · Reavivados | Pendiente | Ruta inmersiva del día. |
| 4A / 4B · Temas | Planificados | Explorador y ficha de situación. |
| 5A / 5B · Curso | Planificados | Índice y lección con identidad propia. |
| 6A · Fuente de libros | Investigación completada; fuente interna sin cerrar | Edición apta o catálogo de enlaces oficiales. |
| 6B / 6C · Libros internos | Dependientes de fuente por título | Texto íntegro y lector separado. |
| 7 · Integración nueva | Pendiente | QA conjunta y estado de publicación. |

## Formato de actualización por etapa

Añadir fecha, etapa, commit, archivos, comportamiento entregado, pruebas con resultado, ubicación durable de capturas y pendientes concretos. Distinguir implementación, verificación y publicación. Una prueba con red simulada no sustituye reproducción real; un enlace externo no completa el lector interno.
