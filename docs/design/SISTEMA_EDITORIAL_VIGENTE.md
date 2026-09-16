# Sistema editorial vigente · Santa Biblia

Revisión del 16/09/2026. Aplica al sitio completo, incluidas las pantallas anteriores al plan. Complementa la guía visual de experiencias; prevalece sobre sus valores de prototipo cuando difieran. El código de referencia es `src/styles/tokens.css`, los estilos compartidos y los componentes existentes. No rediseñar cada sección de forma independiente.

## Dirección

Una publicación de lectura tranquila: papel cálido, tinta legible, títulos editoriales y controles discretos. Home, Biblia, búsqueda, guardados, temas y curso comparten el mismo sistema. Reavivados y el curso tienen ilustraciones reconocibles, pero esas imágenes no dictan una nueva paleta para sus controles ni para el texto de lectura.

El hero del Home conserva su promesa, paisaje y composición. El encabezado de escritorio/tablet reproduce el recorte superior de ese paisaje con el tratamiento correspondiente a día/noche. No comprimir la imagen entera dentro de la barra. El lector mantiene su encabezado inmersivo.

## Funciones del color

| Función | Día | Noche | Uso |
|---|---|---|---|
| Papel de lectura | `--bg-reader` #fbf8f4 | #191519 | Fondo del texto, sin ilustraciones detrás |
| Superficie | `--surface-1` #fffdfa | #211b20 | Tarjetas y paneles comunes |
| Superficie elevada | `--surface-raised` #ffffff | #261f24 | Campos, diálogos y capas interiores |
| Tinta | `--text-primary` #251f1d | #f4ece6 | Títulos, párrafos, etiquetas |
| Tinta secundaria | `--text-secondary` #625754 | #cbbfbd | Contexto y metadatos |
| Acción de lectura | `--action-reading-bg` #496f88 | #b8dfe2 | Botón principal, también `.button` en las pantallas antiguas |
| Texto de acción | `--action-reading-ink` #f9f2e9 | #142336 | Siempre emparejado con el fondo anterior |
| Superficie azul suave | `--accent-mist` #edf4f6 | #293334 | Acción secundaria y apoyos; no grandes bloques brillantes de noche |
| Detalle cálido | `--accent-coral-deep` #914c39 | #ffd0b4 | Estado activo, enlaces, rótulos; no otro color principal de botones |
| Distintivo cálido | `--badge-warm-bg` #f3e2d3 | #44342e | Número de estudio/pregunta y pequeños medallones |
| Tinta del distintivo | `--badge-warm-ink` #3e627a | #f0c2a2 | No mezclar texto azul pálido con un fondo champagne aclarado |
| Error | `--feedback-error` #9a463e | #f0aaa2 | Avisos reales; sin reutilizar un rojo fijo en ambos temas |

No usar `--accent-blue-deep` como si siempre fuera oscuro: cambia de luminancia de noche. Para botones usar el par semántico de acción. No utilizar champagne como fondo de grandes paneles nocturnos. Los colores incrustados en fotografías y el reproductor son excepciones locales deliberadas; no se propagan a buscadores, navegación o tarjetas corrientes.

## Tipografía y superficies

- Playfair Display para títulos editoriales; Lora para lectura y descripciones; Inter para interfaz, controles y rótulos. Respetar la tipografía y escala elegidas en el lector y las lecciones.
- Los rótulos de `PageIntro` usan Inter a 0.72rem, peso 700 y tracking 0.12em. No heredan el tamaño/familia del párrafo introductorio.
- Botones principales redondeados, color plano y texto centrado. Secundarios con fondo suave/borde y una jerarquía inferior. Los dos botones de la tarjeta de lectura mantienen igual tamaño.
- Bordes de un píxel con tokens existentes; sombras discretas `--shadow-sm` en reposo. Evitar sombras acumuladas en tarjeta + cada contenido. Elevación mayor sólo para superposición o interacción.
- Usar radios de la escala existente: campos/paneles pequeños, tarjeta editorial y píldora de acción; no inventar otra familia de radios en cada pantalla.
- Máximo de ancho común 66rem; medidas de lectura alrededor de 45–46rem. Texto alineado a la izquierda, sin justificar. Preservar el espacio entre título, controles y contenido.

## Variaciones permitidas

- **Home:** promesa y paisaje; primera tarjeta como entrada principal. Las tarjetas ilustradas anticipan experiencias, sin convertirse todas en promociones con colores distintos.
- **Reavivados:** paisaje azul/dorado y reproductor azul/ciruela ya aprobado. Compacto, play circular protagonista; sin modificar el diseño de controles acordado. El contexto y la lectura siguen la tipografía común.
- **Temas:** interfaz de consulta sobre papel, acentos cálidos discretos; sin paletas distintas para cada categoría.
- **La Fe de Jesús:** ilustración azul/lila en portada y pequeños detalles ocres. Lecciones sobre papel, preguntas finales colapsadas, progreso real.
- **Biblia, búsqueda y guardados:** mismas superficies, botones, foco y tinta; no conservar un degradado coral sólo por ser pantallas anteriores.
- **Biblioteca EGW:** no visible mientras falte una edición íntegra reutilizable verificada. No ofrecer un catálogo externo como reemplazo.

## Adaptación y navegación

- Una sola navegación principal visible: inferior por debajo de 1024px, superior desde 1024px. El lector conserva su variante inmersiva.
- Auto-ocultamiento sólo en `/read/...`; barra visible al llegar al final. Las demás secciones mantienen la barra inferior fija.
- Los enlaces a nuevas secciones comienzan arriba; al volver a una lectura/contexto se conserva el retorno previsto. No sustituir esto por scroll global indiscriminado.
- A texto ampliado, permitir más líneas y altura. No ocultar desbordes de página para encubrir contenido inaccesible.
- La rejilla de temas responde al espacio disponible en su contenedor en rem, para abandonar las columnas laterales cuando el texto necesita más espacio.
- Mantener búsqueda predictiva, selector compartido, dos columnas móviles de libros cuando caben y desplazamiento independiente de libros/capítulos en escritorio.

## Verificación

Usar `scripts/capture-integration-review.mjs` con `PHASE=final` y, para ampliación, `PHASE=ampliado-final LARGE_TEXT=1`. Las capturas son emulación Chromium, no una certificación de todos los navegadores ni reproducción real del audio. Comparar el mismo ancho y tema, comprobar navegación con teclado y ejecutar los E2E de los flujos afectados. Resultados y límites en el registro de implementación.
