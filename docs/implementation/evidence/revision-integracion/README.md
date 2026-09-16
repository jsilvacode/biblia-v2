# Revisión editorial e integración · 16/09/2026

Capturas de Chromium local. Se revisan Home, selector bíblico, búsqueda, guardados, temas, lectura temática, curso, lección, Reavivados y lector. Los ajustes comparten tokens; no sustituyen el hero ni sus ilustraciones.

- `antes-*`: primera inspección a 390px de seis secciones. La lección inicial era una ruta bloqueada; no usar esa pareja como comparación del contenido de la primera lección.
- `final-*`: diez pantallas, claro/oscuro, 390 y 1440px. El JSON comprueba además 320, 768 y 950px: 100 combinaciones.
- `ampliado-final-*`: diez pantallas con fuente raíz al 200%, ambos temas, captura a 390px y comprobación de 320, 768 y 1440px: 80 combinaciones.

El caso sin historial aparece en las capturas; las acciones con historial y su centrado se cubren en `home-reading-flow.spec.js`. Reavivados usa la respuesta real disponible al capturar y puede mostrar carga/indisponibilidad. Estas imágenes no certifican reproducción del proveedor ni sustituyen pruebas en Safari/iOS físico.

## Comparaciones útiles

| Pantalla | Claro | Oscuro |
|---|---|---|
| Home | [390px](final-home-light-390.png) | [390px](final-home-dark-390.png) |
| Temas | [390px](final-temas-light-390.png) | [390px](final-temas-dark-390.png) |
| Curso | [390px](final-curso-light-390.png) | [390px](final-curso-dark-390.png) |
| Búsqueda | [390px](final-buscar-light-390.png) | [390px](final-buscar-dark-390.png) |
| Lectura temática | [390px](final-lectura-tematica-light-390.png) | [390px](final-lectura-tematica-dark-390.png) |

Reproducir desde la raíz del repositorio con el servidor en 4176:

```sh
PHASE=final node scripts/capture-integration-review.mjs
PHASE=ampliado-final LARGE_TEXT=1 node scripts/capture-integration-review.mjs
```

El script termina con código distinto de cero si detecta desbordamiento horizontal; esto complementa, no sustituye, la inspección visual de solapamientos y la regresión funcional.
