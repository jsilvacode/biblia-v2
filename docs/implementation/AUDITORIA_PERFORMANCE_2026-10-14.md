# Revisión de carga y actualización — 14 de octubre de 2026

Base de comparación: `25c265843554235a232fce37103c3da8e45e2157`.

## Hallazgos y cambios

- **Procesamiento de texto en el hilo principal.** El perfil de CPU situó el mayor coste del primer capítulo en `normalizeScriptureText`: casi 200 expresiones Unicode recorrían cada versículo. Se sustituyeron por una pasada de palabras con búsqueda en un mapa. La comparación de 99.672 textos y encabezados, en los 3.567 capítulos de NBLA, RVA2015 y KJV, dio resultados idénticos. Se conservan las correcciones editoriales y los límites de palabra.
- **HTML anterior durante las actualizaciones.** La navegación de la PWA utilizaba siempre el documento precargado. Ahora solicita el HTML de la versión publicada, con caché y documento precargado como respaldo sin conexión. Se habilita navigation preload y se evita que `/` quede interceptado por el índice precargado antes de esa estrategia.
- **Activación y recarga.** El worker toma control de las pestañas antes de pedir su recarga. La activación ya no espera la promesa de navegación que puede depender de esa misma activación. La migración desde el build anterior se comprobó con una instalación real en un navegador aislado.
- **Descargas en cadena.** Al entrar directamente al lector, el capítulo y el código del lector empiezan a cargar en paralelo. Al abrir el modal de capítulos se prepara el lector; foco o pulsación sobre un capítulo prepara su texto. Se reutilizan la deduplicación de solicitudes y la caché de memoria existentes.
- **Lectura descargada con una red detenida.** Se consulta la caché antes de esperar una solicitud de hasta 12 segundos. Se revalida en segundo plano y se prefiere el texto actualizado de la caché de datos sobre una descarga completa anterior.
- **Código de inicio.** Los ajustes y su CSS se cargan al abrirlos. React y el router tienen un archivo separado que conserva su hash entre cambios de la aplicación. Las 20 lecciones offline comparten un archivo, reduciendo solicitudes durante la instalación sin retirar contenido offline.
- **Prioridades y limpieza.** La precarga prioritaria del paisaje se limita al home; la barra de las demás páginas conserva su fondo mediante CSS. Se eliminan la lista de expresiones compiladas y el conjunto sin límite de referencias precargadas. No se añade la descarga inicial del corpus ni de los índices de búsqueda.

## Medición comparable

Chromium, tres ejecuciones por ruta, mediana, latencia de 150 ms, descarga de 250.000 bytes/s y CPU ralentizada cuatro veces. Builds de producción servidos con Vite Preview, service workers bloqueados para aislar el arranque. Se mide el momento en que aparece el texto del capítulo, el listado de libros o la promesa del día; no equivale a descargar todas las imágenes ni a una puntuación Lighthouse.

| Primera carga sin caché | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Lector, Juan 3:16 | 2.249 ms | 1.192 ms | −47 % |
| Biblioteca bíblica | 1.281 ms | 1.172 ms | −9 % |
| Home, promesa disponible | 2.067 ms | 1.829 ms | −12 % |

La mayor tarea larga del primer capítulo pasó de aproximadamente 787 ms a menos de 100 ms en las muestras. La solicitud del capítulo empezó a los 956 ms, frente a 1.280 ms.

Las recargas con caché no mejoraron de forma uniforme en esta prueba: lector 746 → 985 ms, biblioteca 740 → 735 ms y home 1.269 → 1.434 ms. Vite Preview revalida recursos y producción utiliza caché inmutable para `/assets`; no se extrapolan esas recargas a producción ni se afirma que todas las métricas mejoren. Los tiempos reales también dependen de red, dispositivo y respuesta inicial del alojamiento.

El JavaScript común pasó de 260,57 kB a 246,73 kB sin comprimir (65,37 kB de aplicación y 181,36 kB de framework reutilizable). El CSS inicial pasó de 52,80 a 47,38 kB. La precarga PWA pasó de 85 a 71 entradas; su tamaño total permanece alrededor de 1,76 MiB. Se redujeron solicitudes, sin presentar esto como una reducción equivalente del tamaño offline.

Las muestras se conservan en `evidence/performance-2026-10-14.json`. Los bytes registrados corresponden a la ventana de medición, hasta 350 ms después de aparecer el contenido, y no al peso total de cada página.

## Validación

- ESLint y compilación de producción.
- 176 pruebas unitarias en 40 archivos, incluidas activación sin espera circular, límites de palabras y caché con red detenida.
- Comparación íntegra de textos entre normalizadores y auditoría del corpus: 4.820 archivos y 319.981 entradas.
- Contrato público: 198 libros agregados, 3.567 capítulos de traducciones y 1.189 capítulos CBA.
- Prueba PWA: actualización automática desde la versión anterior, HTML nuevo en home y biblioteca, capítulo descargado con red detenida y apertura offline de una ruta de lectura no visitada, conservando almacenamiento.
- 151 comprobaciones de navegación superadas entre escritorio y móvil; 15 casos se omiten por corresponder a otro tamaño de pantalla. Incluyen la descarga del capítulo antes de terminar de cargar el módulo del lector. Las comprobaciones geométricas esperan la cita y las fuentes definitivas antes de medir los desplegables.

## Repetir las comprobaciones

```sh
npm run build
node scripts/audit-web-performance.mjs http://127.0.0.1:4177 /tmp/performance.json
node scripts/audit-pwa-performance.mjs
```

El primer script requiere servir `dist` con Vite Preview en el puerto indicado. El segundo crea su servidor y navegador aislados. Para comprobar una migración, acepta como argumento la carpeta de un build anterior. Ninguna de estas pruebas borra el almacenamiento del navegador del usuario.
