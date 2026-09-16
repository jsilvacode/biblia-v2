# Evidencia — etapa 4A · guía temática

Las capturas se generan con `node scripts/capture-topics-stage4a.mjs`. Cubren 320, 390, 768 y 1440 px en claro y oscuro, además de 390 px con texto ampliado. Muestran el índice inicial de doce situaciones, la columna fija de áreas a partir de 768 px y los filtros compactos de móvil.

La interacción se valida en `e2e/topics-explorer.spec.js`: colección completa de 92 entradas, búsqueda normalizada en vivo, filtros combinables en la URL, límite inicial y panel móvil de las 13 áreas sin desborde horizontal. La ficha propia de una situación corresponde a la etapa 4B; durante 4A se conserva el despliegue bajo demanda de la lectura existente para no dejar las tarjetas sin un destino funcional.
