# Evidencia — etapa 5B · lecciones de La Fe de Jesús

Las capturas se generan con `node scripts/capture-study-lesson-stage5b.mjs`. Cubren la primera lección a 320, 390, 768 y 1440 px en claro y oscuro, además de 390 px con texto ampliado. Para mostrar el recorrido de la lectura, la primera pregunta de estudio está abierta en cada captura; las tres preguntas del test final quedan cerradas de forma deliberada.

La composición usa papel, azul y ocre en la cabecera y en los módulos de interacción. El cuerpo se mantiene centrado y libre de fondos ilustrados para cuidar la legibilidad. No se trasladan logotipos ni textos de los materiales de referencia, ni se alteran las veinte lecciones ni su contenido.

La interacción se valida en `e2e/study-flow.spec.js`: las preguntas finales parten cerradas, una pregunta pendiente se abre al solicitar el siguiente paso y al volver desde el lector, y la respuesta correcta, el reintento y el desbloqueo conservan el progreso existente. Las preferencias de fuente, escala y espaciado también se verifican.

`e2e/study-flow.spec.js`, `e2e/topic-detail.spec.js` y `e2e/reavivados.spec.js` comprueban que la navegación global inferior permanece visible en las secciones de curso, temas y Reavivados. El ocultamiento suave continúa siendo exclusivo del lector bíblico genérico.

Las imágenes son comparaciones de composición en Chromium y no sustituyen la prueba manual en teléfono físico.
