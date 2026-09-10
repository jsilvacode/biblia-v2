# Auditoría de base para el rediseño

Revisión del repositorio: 10 de septiembre de 2026. Hallazgos que explican el [plan para Luna](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md); no son mejoras nuevas ya implementadas.

## Home y acceso a lectura

- `HomePage.module.css` coloca `.readingActions` en `grid-column: 2` bajo escritorio. Por eso puede haber botones del mismo tamaño y un conjunto desplazado respecto de toda la tarjeta. La etapa 1 debe usar la fila completa y centrarla.
- La oposición del botón principal y secundario se corrige localmente, conservando tipografías, fondos, hero y el resto de componentes. La composición de escritorio a partir de 900 px ya es aprovechable.
- Con historial se muestran las dos acciones exactas del usuario. Sin historial se elige libro/capítulo; no hay razón para fabricar una lectura inicial.
- `BibleNavigator` ya concentra la selección compartida, el scroll interno y búsqueda. Evitar implementar un segundo selector dentro de cada experiencia.
- La búsqueda bíblica conserva una deuda concreta: límite de 100 y coincidencia por subcadenas. La etapa 0B resuelve cobertura completa y palabras completas; debe conservar todos los términos de frases y reutilizar el contrato en ambas entradas.

## Reavivados

La tarjeta actual abre el lector genérico. El calendario reside en `src/features/plans/rpsp2026.js` y cubre 2026. `/plans` sigue siendo el calendario existente. La nueva página debe usar el mismo capítulo esperado y cambiar sólo el destino de la tarjeta cuando la ruta esté lista.

Ya existe `src/features/home/useLocalDay.js`, que usa fecha civil local y un timeout hasta medianoche. Reutilizar/adaptar ese mecanismo y añadir recuperación de foco; no crear distintos relojes que hagan discrepar Home y Reavivados. El reproductor conserva su sesión activa si cambia el día mientras se escucha.

`ReaderPage` mezcla navegación, progreso y acciones bíblicas. Montarlo dentro de la nueva ruta duplicaría comportamiento y estructura. Para la experiencia acotada, `DailyChapterText` consume `loadChapter` y preferencias, sin copiar todos los menús del lector ni su progreso.

## Temas

El catálogo contiene **13 áreas y 92 situaciones**, con IDs, orden y referencias editoriales existentes. La búsqueda debe operar sobre todo el catálogo, aunque sólo se rendericen 12 resultados iniciales. Las categorías pasan a ser filtros; cada situación tiene ficha direccionable.

`TopicPassage.jsx` se comparte con el curso y usa estilos del módulo de Temas. Cualquier variante nueva debe mantener el contrato y aspecto predeterminado del curso. Evitar reglas globales que cambien ambos contextos involuntariamente.

Los IDs contienen guiones: no convertir hashes antiguos dividiendo la cadena por `-`. Construir el mapa exacto desde los datos. Mantener estado de filtro y retorno al abrir una cita en el lector.

## La Fe de Jesús

Base instalada: **20 lecciones, 174 preguntas del material, 188 referencias y 60 preguntas de evaluación**. La primera lección es “¿Quién es Dios?”. La captura adjunta que comienza por “La Biblia” aporta dirección visual; no autoriza sustituir la edición ni reordenar el curso.

Invariantes de implementación:

- Clave de almacenamiento `santa-biblia-v2:study:la-fe-de-jesus:v1`; esquema interno de progreso 2.
- IDs de preguntas `q-XX-YY` y `test-q-XX-YY`; revisión de contenido vigente 1. Conservar los valores reales del repositorio.
- Test de tres preguntas al final; confirmar lectura y responder correctamente sigue formando parte del completado/desbloqueo.
- Mantener reintentos, repaso de lecciones completadas y fusión de progreso entre pestañas.
- Cambiar composición, arte y encabezados no debe migrar ni borrar respuestas.

La portada de referencia incluye “Está Escrito”; el texto instalado tiene su propia [atribución](../../src/content/la-fe-de-jesus/README.md). No inventar afiliación, autoría, formularios de nombre/fecha ni nuevas decisiones personales por reproducir la gráfica.

## Datos y verificación

Las capturas de Analytics aportadas muestran 163 visitantes, 667 vistas, bounce rate global de 53%, 120 visitantes para `/`, 26 para `/bible` y 52% móvil. **La tabla de páginas no es un embudo:** las personas pueden aparecer en varias rutas o entrar directamente; 26/120 no mide conversión Home→Biblia. El periodo breve y el volumen tampoco justifican prometer una reducción concreta del rebote.

Prioridad de UX: hacer evidente y cómoda la entrada a lectura, conservar la atmósfera y verificar el recorrido completo. Cualquier medición futura debe distinguir sesiones que visitan Home, apertura del selector y carga efectiva de lectura, sin enviar consultas, respuestas del curso o elecciones religiosas a analítica.

La validación visual futura debe cubrir 320/390/768/1440 px, claro/oscuro, aumento de texto y promesas largas. La base previa pasó 123 pruebas unitarias y la última ejecución E2E cerró con 73 aprobadas y 13 omitidas; las omisiones no equivalen a comprobaciones realizadas. El [registro de ejecución](ESTADO_EXPERIENCIAS_LECTURA.md) distingue esta base de las nuevas etapas pendientes.
