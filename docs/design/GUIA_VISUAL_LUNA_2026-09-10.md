# Guía visual de ejecución — experiencias de lectura

Fecha: 10 de septiembre de 2026. Revisión y capturas: 14 de septiembre de 2026. Estado: propuesta visual para revisión; no es una aprobación del usuario ni una implementación de producción.

Esta guía acompaña al [plan funcional](../implementation/PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md) y al [prototipo navegable](experiencias-lectura-v1/index.html). Su objetivo es que Luna implemente una composición definida, sin inventar una dirección estética por etapa.

## 1. Cómo usar la entrega

1. Abrir el prototipo y recorrer Home, Reavivados, Temas, La Fe de Jesús y Biblioteca en escritorio y móvil.
2. Consultar sus [estilos de referencia](experiencias-lectura-v1/styles.css), [estados e interacciones](experiencias-lectura-v1/app.js) y [capturas](experiencias-lectura-v1/screenshots/). Las imágenes y archivos del prototipo son referencia de diseño; no copiar su estructura estática como arquitectura React.
3. Implementar sólo la etapa encargada del plan; conservar los componentes, contenido y contratos existentes donde corresponda.
4. Comparar captura de implementación contra captura de referencia con igual ancho, tema y estado. Corregir composición, proporciones y recorte antes de declarar terminada la etapa.

Prioridad: instrucciones posteriores del usuario; requisitos funcionales y accesibilidad; esta guía; composición final del prototipo y sus capturas. Para medidas visuales concretas no fijadas aquí, usar el CSS del prototipo. Si una captura de demostración contiene menos contenido, botones simulados o una fecha de ejemplo, no convertir esa simplificación en una limitación del producto.

No interpretar una diferencia entre mockup y datos reales como autorización para editar contenido doctrinal, fabricar progreso o sustituir una fuente pendiente. Registrar cualquier desviación necesaria en el estado de implementación.

Entrega revisada el 14/09: 80 combinaciones de pantalla/ancho/tema sin desbordamiento de página y 44 capturas. Para valores visuales concretos, el CSS y las capturas finales prevalecen sobre rangos orientativos de las tablas; los contratos funcionales y accesibilidad del plan siempre se conservan. Las nuevas pantallas todavía no están integradas en la aplicación.

Las pestañas que permiten cambiar de pantalla, tema o historial en el prototipo son herramientas de revisión externas a la interfaz del producto. No incorporarlas a la aplicación. El texto bíblico de muestra usa RVA2015 del repositorio para estabilizar las capturas; el producto respeta siempre la versión elegida por la persona.

## 2. Sistema común

Reutilizar `src/styles/tokens.css`. Las variantes de cada experiencia viven en su módulo; no cambiar globalmente `.button`, `--accent` o las fuentes para obtener una tarjeta.

| Uso | Modo claro | Modo oscuro / regla |
|---|---|---|
| Lienzo de lectura | `--bg-reader` `#fbf8f4` | `#191519` |
| Superficie principal | `--surface-1` `#fffdfa` | `#211b20` |
| Papel secundario | `--surface-2` `#f7eee8` | `#2a2228` |
| Texto principal | `--text-primary` `#251f1d` | `#f4ece6` |
| Texto de apoyo | `--text-secondary` `#625754` | `#cbbfbd` |
| Azul de acción | `--accent-blue-deep` `#496f88` | `#b8dfe2`, con texto `#142336` |
| Neblina | `--accent-mist` `#edf4f6` | `#293334` |
| Coral de detalle / foco | `--accent-coral-deep` `#914c39` / `--focus-ring` | Tokens oscuros existentes |
| Salvia de temas | `--sage` `#e8eee7` | `#303932` |
| Papel/champagne | `--accent-champagne` `#e8b18f` | `#f0c2a2`; decorativo, no texto tenue |

El lila del curso es un matiz del arte y una superficie sutil; el texto sigue usando los tokens de tinta. El ocre se concentra en número de estudio, borde o pequeño rótulo. No introducir rojo como color dominante del curso.

| Elemento | Especificación |
|---|---|
| Interfaz | Inter; peso normal 400–500, controles 600–700 |
| Títulos | Playfair Display; peso 400–500, tracking de −0.02em a −0.03em |
| Lectura | Lora; respetar elección y escala de ajustes, sin forzar otra tipografía |
| Título de página | 44–48 px escritorio / 32–36 px móvil; línea 1.1–1.18 |
| Título de sección | 28–32 px escritorio / 24–28 px móvil |
| Título de tarjeta | 24–28 px escritorio / 22–26 px móvil; permitir dos líneas |
| Texto de interfaz | 16 px base; apoyo 14 px; metadatos secundarios 12–13 px |
| Texto largo | 19 px escritorio / 18 px móvil, línea 1.95; ajustes del lector prevalecen |
| Espaciados | Escala existente 4, 8, 12, 16, 24, 32, 48, 72 px |
| Radios | Tarjetas 20–22 px; paneles destacados 18–22 px; campos 14 px; botones 999 px |
| Bordes/sombras | 1 px `--border-subtle`; `--shadow-sm`; máximo una sombra principal por bloque |
| Controles | Área pulsable mínima 44×44 px; acciones principales mínimo 48 px de alto |
| Foco | Anillo de 2 px `--focus-ring`, separación de 2 px; nunca eliminar sin reemplazo |

Usar la familia de iconos existente, trazo uniforme y tamaño 18–22 px. No sustituir controles por emojis. La decoración puede ser suave; las etiquetas deben ser inequívocas.

## 3. Rejilla y adaptación

| Tamaño de referencia | Regla |
|---|---|
| 1440 px | Contenedor principal máximo 1056 px (`66rem`), centrado; lector 720 px (`45rem`). No estirar párrafos hasta el ancho de las tarjetas. |
| 390 px | Margen lateral de 16 px: ancho útil de 358 px. Una columna de contenido; acciones y filtros se adaptan dentro del ancho útil. |
| 320 px | Margen lateral de 16 px: ancho útil de 288 px. Botones largos apilados; ningún scroll horizontal de página. |
| 768 px | Prueba intermedia obligatoria. El salto de composición de la primera tarjeta se mantiene en 900 px, no en 768 px. |

Las alturas son mínimas o de referencia, nunca cajas rígidas que corten texto. Con zoom o traducciones largas la tarjeta crece. Evitar `line-clamp` en título de situación, nombre de libro, nombre de lección y etiquetas de acción.

La cabecera mantiene los destinos principales existentes. En móvil, preservar Inicio, Biblia, Buscar y Guardados y el espacio inferior de la barra más `safe-area-inset-bottom`. Rutas inmersivas tienen un único contexto de navegación; no apilar una cabecera nueva completa sobre otra existente.

## 4. Home: la entrada principal

### Hero

- Conservar `aurora-champagne-landscape.webp`, la promesa diaria y sus variantes de tamaño por longitud.
- Mantener el paisaje a toda anchura, título alineado a la izquierda en escritorio y centrado en móvil, como actualmente. Conservar la luz que se funde con el lienzo inferior; no convertirlo en una portada publicitaria.
- El retoque se limita al degradado de legibilidad y al encuentro con la primera tarjeta; mantener su altura fluida actual. Nada de una segunda ilustración o animación de entrada.
- Conservar los controles actuales de la promesa. Una captura con una promesa breve no autoriza recortar las largas.

### Tarjeta de lectura

- Una sola superficie de papel cálido con el arte editorial actual, borde tenue y sombra leve. El azul aparece en controles, no como un bloque azul saturado detrás de todo.
- Mantener la continuidad entre hero y tarjeta: leve superposición de 16–24 px, sin una franja blanca brusca. El resto del Home sigue a 16 px de separación entre tarjetas.
- Escritorio desde 900 px: icono de 48 px, copia flexible y dos acciones iguales a la derecha; padding 28 px; altura orientativa mínima 176 px. Las acciones no sustituyen el título ni compiten con él.
- Móvil: icono y copia en primera fila; acciones en fila propia que abarque **toda** la tarjeta (`grid-column: 1 / -1`), centradas. Padding 20 px; separación de 20 px antes de las acciones.
- A 390 px: grupo de hasta 384 px pero limitado al espacio real; dos tracks iguales, gap de 8 px; botones mínimo 48 px y mismo padding. Las dos etiquetas pueden ocupar dos líneas equilibradas.
- A 320 px: acciones apiladas, ambas de igual ancho, máximo 272 px, centradas. Aumento de texto también puede activar este apilado; no reducir letra para forzar columnas.
- Principal: fondo `--accent-blue-deep`, texto claro en modo claro y tinta oscura en modo oscuro. Secundario: `--accent-mist`, texto `--accent-blue-deep`, borde tenue. No rojo frente a blanco.
- Con historial: “Tu momento con la Palabra” / referencia real / “Retoma tu última lectura.” / **“Continuar leyendo”** y **“Elegir una lectura”**.
- Sin historial: “Comenzar a leer” / “Elige un libro y un capítulo para comenzar.” / una única acción **“Elegir una lectura”**, centrada. No seleccionar Juan 1 ni fabricar una lectura.
- El grupo es visualmente simétrico: retirar una flecha exclusiva si rompe el equilibrio. No trasladar el centrado sólo al texto interno de los botones.

### Tarjetas siguientes

Orden: lectura bíblica, Reavivados, guía temática, curso; Biblioteca queda después como acceso secundario cuando tenga destino real. Preservar los demás módulos útiles existentes.

RPSP usa cielo abierto azul, horizonte dorado, pradera y Biblia abierta al tercio derecho; curso usa figura acogedora de Jesús, túnica marfil, azul/lila floral. La izquierda ofrece una zona de lectura con degradado suave. No poner todos los textos en blanco sobre la imagen por defecto. Títulos en HTML, nunca horneados en el bitmap.

La guía temática usa calma salvia/marfil y una invitación clara. Mantener la misma familia de tarjetas; diferenciar por contenido y arte, sin convertir cada tarjeta en un anuncio con su propia tipografía.

## 5. Reavivados: escuchar y leer

- Ruta `/reavivados`. Contexto breve “Inicio / Reavivados”, ajustes accesibles y franja panorámica con nombre del programa, fecha y referencia.
- Cabecera de paisaje contenida: hasta 1056 px de ancho, referencia de 192 px de alto en escritorio y 176 px en móvil; puede crecer al ampliar texto. Seguir el recorte final del prototipo, sin recrear un segundo hero de Home.
- Separación de 24–32 px entre cabecera y reproductor; reproductor y capítulo comparten máximo de 720 px. En móvil, player y lectura usan 20 px de margen; la cabecera, 16 px.
- Player sobre papel/neblina, radio 20 px escritorio / 18 px móvil, padding de 25–28 px escritorio / 18–20 px móvil. Título “Reflexión del día”; crédito y fuente en una línea secundaria que puede envolver.
- Controles centrales: retroceder 15 s / reproducir o pausar / avanzar 15 s. Play de 60 px escritorio / 58 px móvil; secundarios de 44 px. Velocidad en control de texto de 44 px, sin barra de iconos abarrotada.
- Barra de progreso real, línea de 4 px y objetivo táctil de 24 px de alto; tiempo actual a la izquierda y duración a la derecha. No simular onda ni duración; antes de metadata mostrar un estado neutro.
- “Fuente: Nuevo Tiempo” es enlace discreto. Presentador sólo si la ficha lo confirma; nombre del programa suficiente si no hay atribución de episodio.
- Capítulo empieza 32–40 px después del player: referencia, versión y texto. Versículos con numeración discreta, lectura cómoda y preferencias actuales.
- No introducir recomendaciones, transcripción inventada, siguiente capítulo, selector de fecha o mini player flotante. Footer al terminar la lectura.

Estados visuales obligatorios: audio disponible y pausado; reproduciendo; cargando; audio pendiente; error recuperable. En los dos últimos, un panel compacto conserva contexto y el capítulo sigue visible. No dejar una caja grande vacía ni bloquear la lectura con un spinner.

El prototipo puede demostrar controles sin un episodio conectado; implementación final usa eventos reales de audio y las fuentes del plan. Fecha y referencia de muestra no se vuelven constantes de producción.

## 6. Temas: buscar una situación, entrar a leer

- Encabezado “¿Qué necesitas hoy?”, apoyo breve y buscador visible. Campo de 56 px de alto, icono de 20 px, padding 16 px y radio 16 px; ancho máximo 704 px.
- Escritorio: columna de áreas de 240–272 px, gap 32 px y dos columnas de resultados. Áreas sticky bajo cabecera; scroll normal de página.
- Móvil: fila desplazable de chips de al menos 44 px, “Todas” y acceso “Ver áreas”; panel con las 13 áreas. El desplazamiento horizontal se limita a esa fila, nunca a toda la página.
- Tarjetas de situaciones con padding 20 px, radio 20 px, área en metadato y referencia principal visible. Título en Playfair Display de 22–23 px; una flecha discreta confirma que abre una ficha.
- Una columna de situaciones a 390 y 320 px. No comprimir dos textos largos en columnas diminutas para ahorrar scroll. Mostrar inicialmente 12 y “Ver más”; búsqueda sobre el conjunto completo.
- Estados de selección se expresan con superficie salvia + borde/texto, además de `aria-pressed` o semántica equivalente. No sólo por un cambio tenue de color.
- Ficha: “Volver a la guía”, área, título de situación y pasaje central completo; ancho 720 px. Después, referencias complementarias como controles claros; sólo una abierta a la vez.
- “Leer capítulo completo” es una acción secundaria reconocible. Atrás conserva consulta, área y posición; no perder el contexto al pasar al lector.
- Estado vacío: explicar que no hay coincidencias y ofrecer limpiar búsqueda o áreas. No reemplazar resultados por recomendaciones nuevas.

No cambiar las 13 áreas ni las 92 situaciones; usar títulos y referencias existentes. Búsqueda temática y buscador bíblico son funciones distintas, aunque compartan estilos.

## 7. La Fe de Jesús: identidad del curso

### Índice

- Hero azul/lila con ilustración acogedora; tipografía del sitio y “La Fe de Jesús” en texto real. Desktop: texto a la izquierda, figura a la derecha; móvil: recorte que conserve rostro/mano y no ponga texto encima del rostro.
- Cabecera más breve que Home: referencia de 280 px de alto en escritorio y 260 px en móvil, ampliable para conservar texto. Priorizar título, descripción existente y una acción real “Comenzar estudio” o “Continuar estudio”; evitar dos botones equivalentes.
- Progreso a continuación: número real de lecciones completadas, barra fina de 4 px y siguiente paso. No inventar rachas ni porcentajes para hacer más vistosa una captura.
- Índice editorial de 20 lecciones, filas con número, título y estado; conservar orden y desbloqueo. Los bloqueos siguen legibles y explican qué lección completar, sin convertir toda la fila en texto casi invisible.
- En móvil el estado puede bajar a segunda línea; nunca sacrificar título para mantener cuatro columnas. Dos columnas de filas en escritorio y una en móvil, conservando el orden de lectura por filas.

### Lección

- Contexto “Volver al curso”; medallón o cinta ocre contemporánea con número de estudio, título Playfair y fondo de papel.
- Cuerpo de 672–736 px, centrado; sin retrato, nubes o flores debajo de párrafos. Arte únicamente en franja superior o márgenes.
- Preguntas conservan su interacción actual. Número ocre discreto, texto legible, referencia reconocible y estado abierto evidente. Secciones separadas por 32 px, preguntas por 12–16 px.
- Mantener decisión personal existente y evaluación de tres preguntas **al final**. Estados correcto/error usan texto e icono además de color; reintentar conserva el contexto.
- La imagen del usuario muestra otra edición empezando por “La Biblia”; el contenido instalado empieza por “¿Quién es Dios?”. Respetar la edición instalada. No copiar logos “Está Escrito”, firmas, formularios Nombre/Fecha ni otra autoría de la portada.

## 8. Biblioteca: editorial y sobria

- Entrada secundaria con título “Biblioteca” y explicación breve; cubiertas editoriales, papel cálido y tipografía del sistema. La Biblia sigue siendo la acción principal del Home.
- Catálogo con dos columnas en escritorio y una en móvil. Cubierta de proporción aproximada 2:3, título/autor claros y una acción con destino explícito. No inventar valoraciones, tiempo de lectura ni una edición.
- Modalidad inicial sin fuente incorporable: **“Leer en EGW Writings”** con indicación visual de enlace externo. No mostrar “Continuar leyendo” ni progreso interno para ese enlace.
- Un mockup del lector interno ilustra el diseño futuro y debe identificarse como tal en la entrega. No equivale a tener el libro disponible ni autoriza copiar texto pendiente de derechos.
- Con edición validada: índice de capítulos en su página; lector de 720 px con libro/capítulo, botón de índice, ajustes y párrafos. Nada de números de versículo falsos ni paisaje detrás de texto.
- Al pie: anterior/siguiente con títulos reales. A 320 px apilar si es necesario, manteniendo orden y ancho común. Progreso separado por libro/edición.

## 9. Selector y lector bíblico: conservar lo ganado

La actualización visual no vuelve a diseñar el selector. Mantener búsqueda de libro/referencia/texto, listado de libros móvil en dos columnas cuando quepan nombres completos, y scroll interno independiente de libros en escritorio que deje visibles los capítulos. Cabecera y búsqueda permanecen accesibles; no restaurar el scroll del contenedor completo observado por el usuario.

La tarjeta abre ese mismo selector; continuar abre el progreso guardado. No introducir un paso extra ni una portada intermedia. El lector bíblico conserva sus rutas, ajustes, navegación y resultados de búsqueda.

## 10. Arte y validación final

- Usar los bitmaps finales entregados con el prototipo y su procedencia; no sustituirlos por imágenes buscadas al azar ni reconstruirlos con degradados si la imagen está disponible.
- No añadir texto dentro del arte. Mantener proporción y foco visual; comprobar recorte a 1440, 390 y 320 px. Si falta un asset, registrar pendiente en vez de afirmar que la etapa está cerrada.
- Tarjetas objetivo ≤180 KB por archivo; cabeceras ≤250 KB. Una imagen compartida entre tarjeta/cabecera puede evitar duplicados si funciona el recorte.
- Contraste de texto normal al menos 4.5:1; controles e indicadores visibles 3:1. Revisar especialmente texto sobre fotografías y acciones en oscuro.
- Probar ancho 320, 390, 768, 1440; modos claro/oscuro; fuente ampliada; navegación de teclado y movimiento reducido. Los controles no quedan tapados por footer/barra móvil.
- Comparación visual: misma ruta, fecha de muestra, historial/progreso y tamaño. Capturas finales acompañadas del estado, no una imagen sin contexto.
- No añadir loaders con espera mínima, scroll suave obligatorio, parallax, carruseles, partículas ni animaciones decorativas. La calma proviene de color, espacio y tipografía, no de hacer esperar al visitante.

**Cierre de etapa:** diseño comparado con referencia, funcionalidad real verificada y diferencias justificadas en el registro. Esta entrega fija una propuesta visual; el usuario puede corregirla antes o durante la implementación.
