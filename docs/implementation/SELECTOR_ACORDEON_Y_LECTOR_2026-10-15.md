# Selector de libros y lector — 15 de octubre de 2026

Se integra la maqueta aprobada del selector en Inicio y en el lector inmersivo.

- Un único desplegable reúne los 66 libros, separados por testamento. Un libro despliega sus capítulos en una cuadrícula dentro del mismo menú. Volver a tocar su nombre o su × cierra la cuadrícula. Tocar un capítulo inicia la lectura directamente.
- El menú se conecta al selector, se abre hacia el espacio disponible y limita su altura a 324 px o al espacio real de la pantalla. Salmos conserva sus 150 capítulos con desplazamiento interno. El selector comienza limpio al cambiar de capítulo.
- Se mantiene la navegación por teclado, la búsqueda de libros al escribir y la precarga de capítulos solo ante intención de lectura. Los controles son botones nativos dentro de un diálogo no modal, sin anidar botones dentro de opciones de un listbox.
- Inicio usa «Elige un libro y capítulo». Las lecturas recientes conservan tres accesos en una fila en escritorio y una última lectura centrada en móvil, sin iconos repetidos ni flechas por lectura.
- El buscador compartido muestra «Buscar» y también funciona en el lector. Conserva las búsquedas por palabras, libros y citas, la carga diferida de la búsqueda de texto y los enlaces con apertura en otra pestaña.
- El lector separa «Volver» de los controles, muestra la versión sobre el nombre del libro y el capítulo debajo, manteniendo los subtítulos bíblicos, los ajustes de lectura, la copia de versículos, el progreso y la navegación contextual.
- Los diálogos y menús emergentes usan una × pequeña arriba a la derecha, con un área de toque de 44 px. La flecha izquierda aparece únicamente cuando existe un panel anterior: comentario → acciones del versículo, ajustes del lector → opciones rápidas.
- Se evita que el desplazamiento automático hacia un versículo quite el selector activo. En Safari se conserva la acción del toque aunque el navegador transfiera el foco al ancestro del botón antes de emitir el clic.

## Ajuste del 16 de octubre

- En escritorio y tablet (desde 768 px), Volver, el selector y el buscador comparten una fila alineada con el ancho del encabezado.
- En móvil, el selector queda entre dos botones circulares de 44 px: Volver y Búsqueda rápida. La búsqueda se abre sobre la fila, sin desplazar el capítulo, con cierre × y foco inicial en el campo.
- Se conserva la búsqueda compartida por libros, palabras y referencias. El modal de capítulos vuelve a la búsqueda; Escape cierra primero el modal, después los resultados y finalmente la barra, restaurando el foco en cada nivel.
- La fila permanece en el flujo de lectura. Su contexto de apilamiento queda por debajo del encabezado fijo, también para desplegables y resultados. La inmersión sigue afectando únicamente a la navegación inferior.

## Verificación

- ESLint y compilación de producción correctos, incluidos los contratos públicos y la auditoría del corpus.
- 187 pruebas unitarias en 41 archivos.
- Batería completa: 176 recorridos correctos y 18 omisiones condicionales de plataforma. Tras el ajuste de Safari, los 40 recorridos del selector, búsqueda y cierres vuelven a pasar.
- Inspección visual y funcional adicional en Chromium y WebKit, a 390 y 1440 px, en día y noche. Sin errores de JavaScript ni desbordamiento horizontal.
- Se mantienen las alturas estables del hero y del panel de Inicio, y la restauración del foco y el desplazamiento al cerrar modales.
