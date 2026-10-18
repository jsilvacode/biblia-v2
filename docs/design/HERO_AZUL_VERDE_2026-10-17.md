# Hero con más paisaje

Conservar las medidas móviles aprobadas y publicar cada mejora antes de integrar la siguiente.

| Etapa | Cambio | Estado |
| --- | --- | --- |
| Aire de escritorio | Aumentar el espacio dentro del hero en la distribución de dos columnas, incluyendo una adaptación moderada para pantallas bajas. Sin cambios de medidas en móvil ni tablet apilada | Publicado en `bca2b43` |
| Nuevo paisaje | Otro paisaje de hora dorada con luz champán, menos rojizo y matices discretos de azul y verde; variantes panorámica y vertical optimizadas | Publicado en `784da0d` |
| Aire del footer | Incrementar suavemente el padding vertical, conservando su información, tipografía y distribución compacta | Completado y validado para publicación |

El aumento de escritorio se limita a la misma condición que las dos columnas: al menos 1100 px de viewport y 58 rem de espacio de contenido. El panel, las fuentes, la barra y los flujos mantienen sus dimensiones y comportamiento.

Objetivo normal a 1440 × 900: apertura de 588 a 684 px (+96 px). En pantallas de 780 px de alto o menos, el aumento es de 76 px. A 390 px de ancho se conserva la apertura de 960 px para la misma promesa e historial.

Altura comprobada en 320, 390, 768, 1024, 1100, 1280 y 1440 px; a 1280 × 720 la apertura mide 616 px. Panel de 384 px conservado y sin desbordamiento. 51 E2E aprobados y nueve omisiones esperadas por plataforma; lint/build/contrato público/corpus correctos. Se revisó día/noche, texto ampliado, menús y alturas estables entre promesas.

El paisaje v6 conserva estas medidas, usa variantes AVIF/WebP y precarga coherente con el picture. Detalles y prompts exactos en `HOME_LANDSCAPE_V6_2026-10-17.md`.

Se comprobó el despliegue del paisaje en el sitio público antes de modificar el footer: Vercel correcto para `784da0d`, foto v6 disponible y revisión funcional en 390/1440 px, día/noche. La apertura conserva 960/684 px, respectivamente.

Footer: padding superior de 8 a 12 px, inferior de escritorio de 8 a 12 px y reserva inferior móvil de 72 a 76 px más área segura. El objetivo es pasar de 61 a 69 px en escritorio (aproximadamente +13%) y de 166 a 174 px en móvil (+5%), manteniendo los enlaces y sus áreas táctiles de 44 px.

Footer validado: 69 px en 1024/1440, 174,34 px en 320/390 y 133 px en tablet de 768 px con su reserva de navegación inferior. Revisión visual, texto al 200% y ausencia de desbordamiento correctos. Se conservan los tres controles y los modales centrados con retorno del foco. Los seis E2E de Acerca de/ayuda/apoyo pasaron en ambos proyectos, incluyendo tres idiomas y dos temas. Lint, build, contrato público y auditoría del corpus correctos.
