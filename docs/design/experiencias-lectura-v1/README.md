# Mockups de experiencias de lectura · v1

Diseño iniciado el 10/09/2026 y revisado el 14/09/2026. Propuesta para revisión del usuario y referencia de implementación para Luna. **No es la aplicación actual ni una integración terminada.**

## Abrir y revisar

Abrir [index.html](index.html) en un navegador. También funciona con un servidor estático, desde la raíz del repositorio:

```sh
python3 -m http.server 4180 --bind 127.0.0.1 --directory docs/design/experiencias-lectura-v1
```

Dirección local: `http://127.0.0.1:4180/`. Los controles superiores pertenecen a la revisión: pantalla, ancho móvil, tema, historial y estado del audio. No se incorporan a la aplicación final.

Para una captura reproducible: `?capture=1&page=home&theme=light`, cambiando `page` por un valor de la tabla. `history=0` muestra la primera visita; `audio=pending|loading|error|playing` muestra estados de Reavivados. La fecha del ejemplo se mantiene en 10/09/2026 para coincidir con el episodio investigado, aunque se revise otro día.

| Pantalla | Identificador | Referencia principal |
|---|---|---|
| Home | `home` | Hero conservado, tarjeta centrada y nuevos accesos. |
| Selector | `picker` | Dos columnas móviles, scroll de libros independiente en escritorio. |
| Lector bíblico | `reader` | Texto y navegación contextual; Hechos 16 como historial de ejemplo. |
| Reavivados | `rpsp` | Audio sobre el capítulo completo de Salmos 34. |
| Guía temática | `topics` | Buscador, categorías y situaciones. |
| Lectura temática | `topic` | Ficha “Tengo miedo”, Salmo 27 y complementarias. |
| Curso | `course` | Índice real de 20 lecciones con arte propio. |
| Lección | `lesson` | Primera lección real, referencias desplegables y test final. |
| Biblioteca | `library` | Modalidad inicial de enlaces oficiales externos. |
| Lector de libro | `book` | Composición futura con texto original de muestra identificado. |

## Lo que está simulado

- No hay API ni reproducción de sonido. Los estados del player son visuales; `04:18 / 15:20` son tiempos de demostración, no datos del episodio. El estado inicial muestra duración desconocida. La implementación debe usar eventos reales del medio.
- El estado vive sólo en memoria. No modifica historial, respuestas ni preferencias del sitio. El curso muestra el inicio del recorrido y su primer estudio; el producto conserva todos los estados y desbloqueos existentes.
- Selector y lector utilizan cinco capítulos de muestra. El buscador del prototipo filtra nombres; la implementación conserva la búsqueda bíblica completa de libros, palabras, frases y referencias. Esta simplificación no autoriza restringir la aplicación.
- La guía contiene las 92 situaciones originales; la ficha desarrollada es “Tengo miedo”. Las demás tarjetas permiten ver su título/referencias, con indicación de muestra. El producto carga el pasaje real de cada situación.
- Las acciones de compartir, guardados y navegación a capítulos no incluidos sólo muestran aviso de revisión. No se presentan como integraciones verificadas.
- La biblioteca no incorpora texto de EGW. Sus enlaces oficiales son externos. El lector de muestra tiene texto original escrito sólo para esta maqueta, sin atribuirlo a EGW.
- Se usa RVA2015 del corpus local para estabilizar las capturas. En producción prevalece la versión elegida por cada persona. La maqueta no otorga una licencia adicional a ese texto.

## Qué debe seguir Luna

1. Leer la [guía visual](../GUIA_VISUAL_LUNA_2026-09-10.md) junto al [plan funcional](../../implementation/PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).
2. Usar [styles.css](styles.css) como referencia de geometría, color y recortes; adaptar a los módulos React actuales. No cargar `app.js`, `content.js` ni los controles de revisión en producción.
3. Reutilizar los assets entregados, no volver a pedir arte aleatorio. Incorporar sólo los WebP necesarios en `public/assets` durante la etapa correspondiente. Los PNG son maestros de diseño.
4. Preservar todas las funciones, controles, textos, créditos, rutas y datos actuales que la muestra simplifique. La barra móvil real conserva posición y safe area; aquí se dibuja al final de la captura completa para evitar repetirla sobre todo el texto.
5. Comparar implementación y referencia con el mismo ancho, tema y estado. Con texto más largo, crecer y reacomodar; nunca recortar para imitar una altura.

## Evidencia y assets

[Capturas](screenshots/) en móvil 390 px y escritorio 1440 px, claro/oscuro, más estados adicionales. El [reporte QA](qa-report.json) registra también 320 y 768 px, desbordamientos, igualdad/centrado de botones e interacciones de muestra. Es emulación Chromium, no pruebas en dispositivos reales ni garantía de accesibilidad completa.

Para regenerar evidencia con el servidor local activo:

```sh
node docs/design/experiencias-lectura-v1/render-mockups.mjs
```

Arte original generado con la herramienta integrada `image_gen`: [Reavivados](assets/rpsp-landscape-v1.webp) y [curso](assets/course-invitation-v1.webp), con [prompt RPSP](assets/rpsp-landscape-v1.prompt.md) y [prompt curso](assets/course-invitation-v1.prompt.md). Pesos WebP aproximados: 87 KB y 89 KB. Los fondos `hero-original`, `reading-original` y `topics-original` se derivan de los assets existentes del proyecto; no son diseños nuevos del hero. Tipografías locales de los paquetes @fontsource instalados; iconos de lucide-react instalado. No se añadieron dependencias a la aplicación.
