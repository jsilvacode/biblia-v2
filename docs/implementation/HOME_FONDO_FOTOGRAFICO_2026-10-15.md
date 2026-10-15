# Fondo fotográfico del Inicio — 15 de octubre de 2026

Se usa la fotografía central proporcionada por el usuario, `lionel-abrial-gUPIPcGCg28-unsplash.jpg`, después de comparar sus encuadres con la primera fotografía. El cielo despejado deja espacio al texto diario y el paisaje continúa bajo el panel de lectura.

## Imagen y composición

- Maestro: JPEG de 2988 × 2988 px, proporcionado por el usuario. Los originales de Descargas no se modifican.
- Copias cuadradas de 1600, 2400 y 2988 px para escritorio y tablet; recorte vertical de la misma foto en 800 × 1360 y 1200 × 2040 px para móvil.
- AVIF a calidad 52 y crominancia 4:2:0, con alternativa WebP a calidad 79. Conversión mediante Sharp, sin ampliar la resolución original ni vectorizar la fotografía.
- El navegador elige una sola variante con `picture`, `srcset`, `sizes` y precarga de alta prioridad coherente con el encuadre. La versión AVIF pesa aproximadamente 65–135 KiB en móvil y 151–480 KiB en escritorio, según resolución y densidad.
- La fotografía ocupa el hero, la separación y el panel completos. Su capa termina 144 px después del panel en móvil y 160 px después en escritorio; una máscara gradual la desvanece hacia el contenido editorial.
- Un velo suave se adapta al tema para mantener la legibilidad del texto y de los controles. El vidrio mantiene su propio reflejo y termina antes de la sección editorial.
- Las alturas y posiciones del hero y del panel permanecen independientes de la carga de la imagen.

## Rendimiento y comprobación

Las variantes se excluyen de la descarga inicial del service worker. Solo se guarda la imagen elegida, mediante una caché de uso con un máximo de seis entradas. La auditoría de la PWA confirma que el fondo se conserva sin conexión y que no se descargan todas las alternativas.

Se revisan los encuadres y ambos temas en Chromium y WebKit, en móvil y escritorio. Las pruebas cubren la elección de una única imagen, la continuidad por debajo del panel, las alturas estables del Inicio, los desplegables y el lector. Compilación, contratos públicos y corpus correctos.
