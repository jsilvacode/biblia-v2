# Evidencia visual — etapa 1, tarjeta de lectura

Generada el 14 de septiembre de 2026 con Chromium en emulación local. Estas capturas comparan la primera tarjeta del Home sin alterar el Hero, el selector ni el progreso persistente.

## Conjuntos

- `baseline/`: cuatro capturas del checkout inicial `1dbd071`, en 390 y 1440 px, con y sin historial, modo claro.
- `final/`: dieciséis capturas de 320, 390, 768 y 1440 px, cada una en claro/oscuro y con/sin historial; más cuatro de texto ampliado a 20 px de raíz, con historial, una por ancho.

Las imágenes son capturas de página completa. La barra de navegación móvil fija aparece en la posición que tendría en el viewport de la captura; las pruebas de flujo verifican que el botón de la tarjeta se puede abrir a 320 px tras hacer scroll.

## Reproducción

Con el servidor de desarrollo en `http://127.0.0.1:4176`:

```sh
node scripts/capture-home-stage1.mjs --baseline
node scripts/capture-home-stage1.mjs
```

El script preserva los cuatro estados mediante las claves locales existentes de ajustes y lectura; no añade datos de demostración a la aplicación.
