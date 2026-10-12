# Fidelidad de la integración · 12/10/2026

La comparación con la maqueta detectó tres diferencias de presentación: iconos de libro cerrado/engranaje y trazos más gruesos; renovación de la cabecera limitada a la variante del Home; desaparición del manto al solicitar transparencia reducida. El manto normal ya estaba integrado, pero su reflejo inicial era muy discreto.

Se recuperaron libro abierto, controles de Ajustes, trazo SVG 1.6 sin compensación absoluta, iconos de cabecera de 17 px y tipografía uniforme de la maqueta. La barra comparte acabado de vidrio en móvil y escritorio; el lector conserva Volver, referencia, menú contextual, posición fija y su navegación inferior. El manto conserva una superficie visible al reducir transparencia y sus reflejos normales se refuerzan sin añadir un cierre de caja.

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

[Resultados de 48 diseños](layouts.json): dos motores, Home/Biblia/lector, cuatro anchos (320, 390, 768, 1440 px) y ambos temas. Sin desbordamiento del documento o la cabecera; manto con máscara y superficie presentes; imágenes del Home decodificadas. La invitación de instalación de Safari se conserva y puede aparecer en las capturas con historial. La navegación fija en una captura de página completa puede figurar a mitad del documento.

La regresión de cabecera cubre tipografía coherente, iconos y vidrio, además del fallback con `prefers-reduced-transparency` emulado por CDP. Home y navegación validaron 46 casos aplicables y ocho omisiones previstas; cuatro tiempos de espera bajo carga concurrente aprobaron al repetirse sin modificar las specs. Lint, 164 unitarios y build con auditorías aprobados.

Regresión general final: 119 pruebas aprobadas y 20 omisiones previstas; una expectativa del ancho anterior de la cabecera del lector (1056 px) se actualizó al ancho editorial compartido (1100 px). Ese caso completo aprobó al repetirse, incluidos selector, foco y navegación. Total de casos aplicables validados: 120, sin fallos pendientes.

WebKit 26.5 y Chromium se ejecutan mediante Playwright en macOS. No es una prueba física de Safari/iOS. El estado del despliegue de esta corrección se comprueba después del push por el SHA publicado.
