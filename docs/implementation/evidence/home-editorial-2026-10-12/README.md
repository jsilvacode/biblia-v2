# Home editorial · 12/10/2026

Capturas de la aplicación integrada, con datos reales de la promesa y del calendario. El historial se prepara con Juan 15:5 para mostrar «Última lectura». No son imágenes del prototipo independiente.

| Ancho | Día | Noche |
|---|---|---|
| 390 px | [Home](home-390-light.jpg) | [Home](home-390-dark.jpg) |
| 1440 px | [Home](home-1440-light.jpg) | [Home](home-1440-dark.jpg) |

Los screenshots de página completa pueden mostrar la navegación móvil fija en una posición intermedia: es una consecuencia de la captura del navegador. Las pruebas de interacción comprueban su posición real en el viewport.

## Cobertura

- [24 diseños](layouts.json): ES a 320/390/768/1440 px, claro/oscuro, con/sin historial; EN y PT a 390/1440 px en ambos temas. Sin desborde horizontal; siete imágenes cargadas y decodificadas en cada combinación.
- [Geometría de los selectores](picker-results.json): cuatro viewports de 320×568 a 1440×900, apertura superior/inferior, separación cero con el campo y máximo común de 288 px, reducido al espacio disponible.
- [Gestos y limpieza](picker-touch-cleanup.json): swipe táctil por CDP, sin seleccionar accidentalmente, escritura de «1 Corintios», ESC/Tab y ausencia de listeners al cerrar/desmontar.
- [Desplegable claro](picker-390-light.png) y [oscuro](picker-390-dark.png): vidrio con blur, reflejo y campo unido a la lista.
- Hover de título/imagen/flecha y preferencia de movimiento reducido verificados; teclado y texto ampliado cubiertos por E2E.

Lint, 164 unitarios, build, auditorías públicas y corpus aprobados. La regresión final de Home y navegación consta de 38 casos aplicables aprobados y ocho omisiones por plataforma; la suite general de las otras rutas también aprobó. El primer caso de Home verifica la decodificación de las tres imágenes editoriales y la carga de los cuatro iconos.

Motor: Chromium con emulación de tamaños, zona horaria America/Santiago y estados locales controlados. No certifica dispositivos físicos Safari/iOS o Android. La verificación del SHA desplegado y del sitio público se realiza después del push a `origin/main`.
