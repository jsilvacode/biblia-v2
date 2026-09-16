# Evidencia — etapa 5A · índice de La Fe de Jesús

Las capturas se generan con `node scripts/capture-study-index-stage5a.mjs`. Cubren el índice del curso a 320, 390, 768 y 1440 px, claro y oscuro, además de 390 px con texto ampliado. Hay dos estados adicionales con la primera lección completada para comprobar que la acción pasa de “Comenzar estudio” a “Continuar estudio” y apunta al siguiente paso real.

La portada usa `home-study-invitation-v1.webp`, el arte ya instalado para la tarjeta de Home. La identidad del curso se forma con su recorte, velo azul/lila y textos HTML; no incorpora logotipos ni texto horneado de la referencia editorial.

Las imágenes son una comparación de composición en Chromium y no reemplazan la prueba en hardware. La interacción se cubre en `e2e/study-flow.spec.js`: conserva la ruta, las veinte lecciones y los bloqueos, muestra el progreso persistido y verifica una columna en móvil y dos columnas en escritorio.
