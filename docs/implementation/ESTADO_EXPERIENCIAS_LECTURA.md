# Estado de ejecución — experiencias de lectura

Actualizado: 10 de septiembre de 2026. Encargo: [plan principal para Luna](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).

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
| 0A · Base para Luna | Pendiente al iniciar implementación | Registrar commit inicial y capturas de su checkout. |
| 0B · Cobertura de búsqueda | Pendiente | Palabras completas y acceso a todos los resultados. |
| 1 · Primera tarjeta | Lista para ejecutar; no implementada | Centrado móvil, tonos suaves y estados con/sin historial. |
| 2 · Arte | Planificado | Assets finales y procedencia. |
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
