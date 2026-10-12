# Fidelidad de la integración · 12/10/2026

La comparación con la maqueta detectó tres diferencias de presentación: iconos de libro cerrado/engranaje y trazos más gruesos; renovación de la cabecera limitada a la variante del Home; desaparición del manto al solicitar transparencia reducida. El manto normal ya estaba integrado, pero su reflejo inicial era muy discreto.

Se recuperaron libro abierto, controles de Ajustes, trazo SVG 1.6 sin compensación absoluta, iconos de cabecera de 17 px y tipografía uniforme de la maqueta. Home, páginas y lector reutilizan la misma barra: marca a la izquierda, navegación centrada en desktop, tema y opciones a la derecha. El lector añade Volver junto a la marca y el selector de libro/capítulo del Home en una fila compacta de 44 px, con la lectura actual seleccionada. La navegación inferior Biblia abre ese mismo listado; se retira el diálogo anterior del lector. Opciones, guardados, regreso a guías/estudios, progreso e inmersión conservan sus flujos.

En desktop el manto cubre todo el ancho de los tres artículos. El desvanecido lateral se desplaza fuera del contenido; el vertical continúa perdiéndose al final de la sección. La superficie permanece visible al reducir transparencia y los reflejos normales se refuerzan sin añadir un cierre de caja.

## Capturas de la aplicación

| Vista | Día | Noche |
|---|---|---|
| Home · WebKit · 390 px | [Captura](webkit-home-390-light.jpg) | [Captura](webkit-home-390-dark.jpg) |
| Home · WebKit · 1440 px | [Captura](webkit-home-1440-light.jpg) | [Captura](webkit-home-1440-dark.jpg) |
| Biblia · WebKit · 390 px | [Captura](webkit-bible-390-light.jpg) | [Captura](webkit-bible-390-dark.jpg) |
| Biblia · WebKit · 1440 px | [Captura](webkit-bible-1440-light.jpg) | [Captura](webkit-bible-1440-dark.jpg) |
| Lector · WebKit · 390 px | [Captura](webkit-reader-390-light.jpg) | [Captura](webkit-reader-390-dark.jpg) |
| Lector · WebKit · 1440 px | [Captura](webkit-reader-1440-light.jpg) | [Captura](webkit-reader-1440-dark.jpg) |
| Home · Chromium · 1440 px | [Captura](chromium-home-1440-light.jpg) | [Captura](chromium-home-1440-dark.jpg) |

[Resultados de 56 diseños](layouts.json): dos motores, Home/Biblia/lector, cuatro anchos (320, 390, 768, 1440 px) y ambos temas; además, lector EN/PT con texto al 200% a 320 y 1024 px. Sin desbordamiento del documento o la cabecera ni solapes entre marca, navegación y herramientas. Manto con máscara y superficie presentes, ancho superior al cuerpo en desktop; imágenes del Home decodificadas. La invitación de instalación de Safari se conserva y puede aparecer en las capturas con historial. La navegación fija en una captura de página completa puede figurar a mitad del documento.

La regresión cubre tipografía coherente, iconos, vidrio y su ancho, el fallback con `prefers-reduced-transparency` emulado por CDP, la disposición del lector y el selector reutilizado. Libro/capítulo actuales, reset al cambiar libro, navegación, teclado, límites, menú separado y Biblia inferior verificados. La búsqueda por referencia/texto permanece en `/bible`.

Validación final sobre el código completo: lint, 165 unitarios en 37 archivos, build con auditorías de contrato/corpus y 122 E2E aprobadas con 20 omisiones previstas. Sin fallos pendientes.

WebKit 26.5 y Chromium se ejecutan mediante Playwright en macOS. No es una prueba física de Safari/iOS. El estado del despliegue de esta corrección se comprueba después del push por el SHA publicado.
