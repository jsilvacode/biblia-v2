# Fondo fotográfico del Inicio — 15 de octubre de 2026

La revisión móvil mostró que la fotografía central tenía demasiado cielo y dejaba el paisaje bajo el selector. Se sustituye por la primera fotografía proporcionada por el usuario, `kalen-emsley-Bkci_8qcdvQ-unsplash.jpg`: montañas, valle y bosque visibles desde el hero.

## Imagen y composición

- Maestro: JPEG de 5760 × 3840 px. Los originales de Descargas no se modifican.
- Se eliminan los primeros 900 px de cielo. Escritorio y tablet usan un recorte de 5760 × 2940 px, exportado a anchos de 1600, 2400 y 3200 px.
- Móvil usa un recorte centrado en el valle: origen (2280, 900), tamaño 1200 × 2940 px, exportado a 800 y 1200 px de ancho. Mantiene las montañas detrás de la promesa, en lugar de mostrar una pantalla de cielo.
- AVIF a calidad 51 y crominancia 4:2:0; alternativa WebP a calidad 79. Sharp convierte y redimensiona sin ampliar los originales ni vectorizar la fotografía.
- `picture`, `srcset`, `sizes` y precarga coinciden para descargar una sola variante. En escritorio se cuenta el ancho real que necesita `object-fit: cover` al cubrir hero y panel, evitando ampliar una imagen pequeña. AVIF: aproximadamente 113–215 KiB en móvil y 128–417 KiB en escritorio.
- Las URL `home-landscape-v3-*` permiten actualizar las imágenes pese a la caché inmutable. Se retiran las variantes anteriores sin referencias.
- Se reduce el velo inferior respecto a la composición anterior. El texto conserva su contraste con velos por tema y el selector conserva su vidrio independiente, con reflejo definido y fondo desenfocado.
- Móvil conserva un hero de 35rem y usa un panel de 24rem con mayor margen interior, una última lectura centrada y tres lecturas en escritorio; el perfil de pantallas muy estrechas conserva la altura necesaria para promesas largas. Las alturas siguen independientes de la promesa, el historial y la carga de imágenes, y pueden crecer cuando el texto ampliado lo necesita.
- La fotografía cubre hero y panel completos, con una cola difuminada de 144 px en móvil y 160 px en escritorio. El vidrio termina antes de la sección editorial.

## Rendimiento y comprobación

Las variantes se excluyen de la descarga inicial del service worker. Solo se guarda la imagen elegida, mediante una caché de uso con un máximo de seis entradas; el fondo sigue disponible sin conexión.

La comprobación visual incluye la promesa larga del 15/10/2026 en RVA2015 y ambos temas, en Chromium y WebKit. Las pruebas del Inicio cubren alturas estables, texto ampliado, una única imagen por carga, continuidad bajo el panel y funcionamiento del selector y del lector. También se revisan compilación, contratos públicos, corpus y funcionamiento sin conexión.
