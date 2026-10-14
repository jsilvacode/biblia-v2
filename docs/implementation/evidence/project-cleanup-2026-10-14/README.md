# Home, arranque y limpieza del proyecto · 14/10/2026

## Interfaz

El Home conserva el titular y la indicación «Elige libro y capítulo». Se ocultan visualmente las etiquetas repetidas de los campos, manteniéndolas como nombres accesibles. Los campos vacíos muestran «Seleccionar libro» y «Capítulo» y ganan un contorno suave sobre el vidrio. Se redistribuye el espacio interior sin ampliar la separación del hero.

El splash HTML, su animación, su temporizador React y sus dos precargas se retiraron. El HTML precarga el paisaje de la interfaz y ofrece un fondo básico claro/oscuro durante el arranque.

## Limpieza comprobada

- Ocho archivos sin referencias de producción: el antiguo acordeón de libros, el panel de navegación rápida sustituido y las páginas/estilos de la guía anterior al modal.
- Ocho funciones y una constante de navegación temática que sólo atendían esas pantallas antiguas. Se conservan el reconocimiento de enlaces anteriores, el análisis de referencias y su formato localizado.
- Cincuenta selectores CSS globales de esos componentes, comprobados sin consumidores JSX antes de su retirada.
- La imagen `home-continue-editorial-v2.webp` (38,664 bytes), sin consumidor en la aplicación ni en las herramientas.
- Se mantienen el worker de búsqueda y el parser del estudio: el primero es una entrada por `new URL`, y el segundo se usa al generar las lecciones. No se confundieron con archivos muertos.

La revisión del grafo incluye `src/main.jsx`, las entradas de API y scripts y las entradas `new URL` de workers. Tras la limpieza no quedaron archivos JS/JSX/CSS huérfanos de producción en `src`, excluidos tests y configuración de pruebas. La revisión no pretende demostrar por sí sola ausencia de todos los exports o estilos sin uso.

## Carga y procesos

| Recurso | Antes | Después |
| --- | ---: | ---: |
| Precarga PWA sin compresión de transporte | 1,999,039 bytes / 86 entradas | 1,782,286 bytes / 83 entradas |
| CSS global compilado | 57,523 bytes | 52,900 bytes |
| HTML compilado, aproximadamente | 5.05 KB | 2.83 KB |
| Precargas prioritarias exclusivas del splash | 2 imágenes / 103,325 bytes | 0 |
| Worker de búsqueda en reposo | Se iniciaba al montar la pantalla | 0; se crea tras una consulta válida y su debounce |

La precarga PWA se reduce un **10.84%** y el CSS global aproximadamente un **8%**. Las cifras describen recursos y procesos; no equivalen a una mejora porcentual del tiempo de carga en cualquier conexión.

Los gráficos sociales permanecen disponibles para la API de tarjetas y para compartir enlaces, pero dejan de descargarse al instalar el caché offline de la interfaz. Los iconos de instalación, fuentes y código de las páginas siguen precargados. Las versiones y el comentario conservan sus endpoints públicos, descarga voluntaria, caché y corpus.

El worker se reutiliza entre consultas y termina al desmontar la pantalla. No se alteraron el debounce, la paginación, la cancelación de resultados antiguos ni la carga de índices por idioma/versión.

## Validación

- Lint y 165 pruebas unitarias de 38 archivos aprobados; incluye creación diferida, reutilización y cierre del worker.
- 101 escenarios E2E distintos verificados en Chromium móvil/escritorio. La nueva envoltura reveló una separación de 2 px entre campo y desplegable: se corrigió el cálculo al usar la caja interior del anclaje y los dos casos se repitieron correctamente, sin ampliar su tolerancia.
- WebKit a 320/390/1440 px y ambos temas: etiquetas completas, bordes, accesibilidad, ausencia de desbordes y de solicitudes de las imágenes del splash. Emulación de navegador, no hardware físico.
- Compilación real con service worker: Home, Juan 3 y el modal de Efesios 4:6 del estudio funcionan sin conexión después de visitarlos. Los gráficos sociales no aparecen en sus cachés.
- Build y auditorías del contrato público y corpus aprobados: 198 libros agregados, 3567 capítulos de traducciones, 1189 de comentario y 4820 archivos de texto.
- `git diff --check` aprobado. El plan de diseño no registrado del usuario se mantiene fuera del commit.
