# Hero con más paisaje

Conservar las medidas móviles aprobadas y publicar cada mejora antes de integrar la siguiente.

| Etapa | Cambio | Estado |
| --- | --- | --- |
| Aire de escritorio | Aumentar el espacio dentro del hero en la distribución de dos columnas, incluyendo una adaptación moderada para pantallas bajas. Sin cambios de medidas en móvil ni tablet apilada | Completado |
| Nuevo paisaje | Otro paisaje de hora dorada con luz champán, menos rojizo y matices discretos de azul y verde; variantes panorámica y vertical optimizadas | Preparación visual |

El aumento de escritorio se limita a la misma condición que las dos columnas: al menos 1100 px de viewport y 58 rem de espacio de contenido. El panel, las fuentes, la barra y los flujos mantienen sus dimensiones y comportamiento.

Objetivo normal a 1440 × 900: apertura de 588 a 684 px (+96 px). En pantallas de 780 px de alto o menos, el aumento es de 76 px. A 390 px de ancho se conserva la apertura de 960 px para la misma promesa e historial.

Altura comprobada en 320, 390, 768, 1024, 1100, 1280 y 1440 px; a 1280 × 720 la apertura mide 616 px. Panel de 384 px conservado y sin desbordamiento. 51 E2E aprobados y nueve omisiones esperadas por plataforma; lint/build/contrato público/corpus correctos. Se revisó día/noche, texto ampliado, menús y alturas estables entre promesas.
