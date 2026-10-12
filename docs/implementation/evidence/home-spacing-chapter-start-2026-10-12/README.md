# Espaciado del Home y comienzo de capítulo · 12/10/2026

El vidrio ahora pertenece sólo al selector. El plano y el reflejo se desvanecen por completo antes de la sección editorial. Se añaden 10–16 px de aire al hero, según viewport, y 16–20 px después del selector. El footer del Home recupera el fondo compartido, conservando apoyo al proyecto y contacto. Los controles de tema/ajustes son círculos de 44 × 44 px en todas las cabeceras.

El lector incluye Anterior / Inicio / Siguiente. Inicio desplaza al comienzo del capítulo, enfoca su título, respeta movimiento reducido y conserva URL, versión e historial. En móvil los destinos largos se reservan al nombre accesible; en escritorio se muestran completos. El texto de lectura permite partir palabras largas cuando se amplía.

## Comprobaciones

- Lint, build, auditoría del contrato público/corpus y `git diff --check`: aprobados.
- 14 E2E distintos aprobados en móvil/escritorio: vidrio acotado, transparencia reducida, selector centrado, menús arriba/abajo, teclado y comienzo del capítulo. Los cuatro casos de navegación se repitieron tras simplificar las etiquetas móviles.
- `layouts.json`: 24 combinaciones Chromium/WebKit 26.5, ambos temas; Home a 320/390/768/1440 px y lector a 320/1440 px. Sin desbordes ni solapes en el pager; iconos superiores cuadrados de 44 px.
- `accessibility.json`: cuatro combinaciones a 320 px y texto al 200%, EN/PT, Chromium/WebKit. Incluye ocho comprobaciones adicionales del primer/último capítulo: anterior/siguiente deshabilitados donde corresponde e Inicio disponible.
- Capturas WebKit con fuentes e imágenes listas. Son emulación de navegador, no hardware físico.

## Capturas

| Vista | Día | Noche |
| --- | --- | --- |
| Home desktop | [Día](webkit-home-1440-light.jpg) | [Noche](webkit-home-1440-dark.jpg) |
| Selector y siguiente sección | [Día](webkit-mantle-390-light.jpg) | [Noche](webkit-mantle-390-dark.jpg) |
| Footer desktop | [Día](webkit-footer-1440-light.jpg) | [Noche](webkit-footer-1440-dark.jpg) |
| Footer móvil | [Día](webkit-footer-390-light.jpg) | [Noche](webkit-footer-390-dark.jpg) |
| Final de capítulo móvil | [Día](webkit-chapter-end-320-light.jpg) | [Noche](webkit-chapter-end-320-dark.jpg) |
| Final de capítulo desktop | [Día](webkit-chapter-end-1440-light.jpg) | [Noche](webkit-chapter-end-1440-dark.jpg) |

La publicación se verifica después del push contra su SHA, alias canónico y recursos reales del navegador.
