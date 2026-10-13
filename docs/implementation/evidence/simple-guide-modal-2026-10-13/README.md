# Guía simple, citas en modal y revisión de carga · 13/10/2026

La guía presenta un selector con las 92 situaciones, agrupadas en las 13 áreas existentes. Al elegir una situación aparecen la lectura central y las citas complementarias. Se retiraron el buscador, la frase introductoria y la navegación intermedia. Los enlaces antiguos por ruta, categoría y ancla siguen resolviendo situaciones conocidas.

Guía y estudio comparten el modal `ReaderDialog`, la tipografía de lectura y las preferencias de versión/tamaño/interlineado. Cerrar devuelve el foco y la posición a la cita; no cambia la URL, el historial bíblico ni los avances o respuestas del estudio. Se conserva el reintento cuando un capítulo no se puede cargar.

El selector del lector muestra **Capítulo** cuando está vacío. A partir de 375 px los dos campos caben en una fila; hasta 365 px se organizan en dos filas centrales, manteniendo los botones de los extremos y sus áreas táctiles de 44 px.

## Revisión de carga

- Las páginas y lecciones mantienen sus módulos diferidos. El contenido del modal se importa al abrir una cita.
- El selector sólo monta las 92 opciones cuando se despliega y comparte con Home/lector el límite de 288 px y el posicionamiento según el espacio disponible.
- Desplegar una pregunta del estudio sólo crea sus botones de referencia. Cerrar la pregunta desmonta esa lista; no deja lectores ocultos cargando capítulos al cambiar la versión.
- El repositorio bíblico conserva la deduplicación de solicitudes, caché LRU de 32 capítulos y 8 comentarios, límite de espera y recuperación offline.
- Se conservaron la carga diferida de imágenes y el audio con `preload="none"`. No se añaden solicitudes de toda la Biblia ni se altera su corpus.
- La compilación mantiene el principal en aproximadamente 85.4 KB gzip y el precache PWA en 1,951.65 KiB, frente a aproximadamente 1,973 KiB anteriores.

### Medición reproducida en WebKit

Navegador con contexto nuevo, NBLA, anchos 320/390/1440 px, ambos temas. Las cifras cuentan solicitudes a `/data/nbla/`.

| Acción | Antes | Después |
| --- | ---: | ---: |
| Desplegar tres preguntas de la primera lección | 3 capítulos | 0 capítulos |
| Elegir una situación en la guía nueva | — | 0 capítulos |
| Abrir una cita de un capítulo | — | 1 capítulo |
| Cerrar y volver a abrir esa cita | — | 0 solicitudes adicionales |

La medición verifica solicitudes evitadas; no es una promesa de tiempo de carga en una conexión concreta.

## Validación

- Lint, build, auditorías de contrato público y corpus y `git diff --check` aprobados.
- 56 pruebas unitarias aprobadas: selector, referencias/rangos, caché, progreso del estudio y diccionarios.
- 21 E2E de guía/estudio y 4 E2E de los selectores compartidos aprobados en Chromium móvil/escritorio. Un caso exclusivo de móvil se omite en escritorio.
- WebKit: revisión visual y funcional a 320/390/1440 px, claro/oscuro; etiquetas completas, citas exactas, caché al reabrir y ausencia de desborde horizontal. Es emulación de navegador, no hardware físico.
