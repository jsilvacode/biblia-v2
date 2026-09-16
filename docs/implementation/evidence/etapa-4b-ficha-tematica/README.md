# Evidencia — etapa 4B · ficha temática

Las capturas se generan con `node scripts/capture-topic-detail-stage4b.mjs`. Cubren la ficha “Tengo miedo” a 320, 390, 768 y 1440 px, en claro y oscuro, además de 390 px con texto ampliado.

Muestran el retorno a la guía con sus filtros, el pasaje central inmediato y el selector de lecturas complementarias. La captura no abre una complementaria: esa ausencia es deliberada y confirma que el índice y la ficha no precargan los cinco pasajes secundarios. La interacción se prueba en `e2e/topic-detail.spec.js`: abre una complementaria identificada por `reading=companion-1`, entra al lector, vuelve a la misma ficha y conserva consulta, filtro y selección.

Las imágenes son una comparación de composición en Chromium. Las rutas antiguas `?category=…#topic-…` y una ficha inexistente se validan por navegador; no se representan como capturas porque son estados de compatibilidad y recuperación, no la presentación editorial habitual.

En móvil, la ficha mantiene la barra inferior global fija, como las demás secciones fuera del lector bíblico. El auto-ocultamiento y su transición suave pertenecen únicamente al lector. `e2e/topic-detail.spec.js` comprueba esta separación sin cambiar la navegación propia del lector.
