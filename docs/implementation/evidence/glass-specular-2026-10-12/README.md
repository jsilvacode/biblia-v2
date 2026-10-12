# Vidrio con reflejo definido · 12/10/2026

El usuario detectó que el material anterior (`aa426d3`) parecía una mancha o sombra. Los gradientes radiales fríos/cálidos, sus reflejos desenfocados y el fondo mayormente uniforme producían niebla, aunque las capas estuvieran pintadas correctamente.

Se retiran los gradientes de color y el glow desenfocado. El plano de vidrio es neutro y transparente, con backdrop de 10 px; una segunda capa encima dibuja un reflejo diagonal y un labio superior de 1 px, sin filtro. El borde lateral/reflejo se extingue en los primeros 420 px, sin borde inferior. El plano transparente se mantiene detrás de los artículos y se disuelve al terminar la sección. El paisaje continúa 240 px bajo el hero en desktop y 180 px en móvil, dando textura real al backdrop del selector. Esta extensión modifica el encuadre `cover` del paisaje; no cambia el tamaño ni la disposición del contenido del hero.

## Capturas

- [Claro desktop](webkit-mantle-1440-light.jpg), [oscuro desktop](webkit-mantle-1440-dark.jpg).
- [Claro móvil](webkit-mantle-390-light.jpg), [oscuro móvil](webkit-mantle-390-dark.jpg).
- Las capturas `home` muestran la continuidad con el hero; las capturas `mantle` muestran el selector y los primeros artículos.
- `layouts.json`: 16 estados Home en Chromium y WebKit 26.5, 320/390/768/1440 px y ambos temas, sin desborde horizontal. Las siete imágenes reales se cargan y decodifican.

## Comprobación

Lint, `git diff --check` y build con auditorías aprobados. Ocho E2E aprobados: transparencia reducida, cobertura completa del manto en desktop, selección responsive y listas de libros/capítulos conectadas, contenidas y adaptativas. Sin cambios en lógica o estado del lector. Estas son capturas de emulación, no una certificación en iPhone físico. Publicación verificada después del push contra el SHA exacto.
