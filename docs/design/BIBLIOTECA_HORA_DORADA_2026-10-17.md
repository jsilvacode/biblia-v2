# Biblioteca y hora dorada

Conservar la composición compacta del home y sus márgenes; publicar cada mejora antes de integrar la siguiente.

| Etapa | Cambio | Estado |
| --- | --- | --- |
| Biblioteca | Distinguir categorías mediante papel, luz y motivos discretos por familia; presentar los libros como un índice editorial. Mantener tarjetas desktop/tablet, dropdown móvil, filtros, búsqueda y modal de capítulos | Publicado: `7e34c4d` |
| Lecturas y material | «Continuar» solo en móvil; reforzar la acción de las lecturas en escritorio. Dar profundidad y textura al acabado Ópalo en modo día, conservando las dimensiones y la lectura limpia | Publicado: `d4d5233` |
| Paisaje | Nueva imagen original de hora dorada, luz cinematográfica y niebla suave detrás del verso; variantes panorámica y vertical optimizadas, precarga y una sola descarga apropiada | Completado |

La diferenciación de categorías se resuelve con CSS en lugar de trece fotos: los motivos y tonos distinguen familias sin agregar peticiones de imagen ni competir con los nombres. El texto, los iconos y los estados seleccionados mantienen su semántica.

La observación sobre la textura del modo día se incorpora a la biblioteca y al panel de lectura: superficies cálidas, iluminación y relieve sutiles, sin ruido sobre el cuerpo de lectura bíblica.

Biblioteca: 22 E2E de biblioteca y ampliación de texto aprobados; lint/build/contrato público/corpus correctos. Revisión visual en 320, 390, 768 y 1440 px, día y noche; sin nuevas imágenes ni cambios de lógica.

Lecturas y material: 46 E2E de home, búsqueda rápida, acordeón, material y altura estable aprobados; lint/build/contrato público/corpus correctos. «Continuar» se oculta por encima de 620 px, manteniendo la descripción accesible. Los tres enlaces de escritorio usan color, subrayado discreto, relleno y respuesta de foco/hover; el Ópalo diurno gana un tono cálido, sombreado y grano suave sin cambiar sus dimensiones ni transparencia.

Paisaje: generado con `image_gen` integrado, panorámica nativa de 1672 × 941 px y vertical de 941 × 1672 px, sin ampliar ni afirmar resolución 4K. Variantes AVIF/WebP en `public/assets/home-landscape-v5-*`; candidatos nativos AVIF de 141190/153746 bytes. Prompts exactos y archivos en `HOME_LANDSCAPE_2026-10-17.md`. 38 E2E aprobados, validación día/noche y auditoría PWA de fondo offline, caché de una única fotografía y lectura descargada correctas.
