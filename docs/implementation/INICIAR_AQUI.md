# Inicio de implementación — Santa Biblia

Actualizado el 14/09/2026. Listo para comenzar por la primera tarjeta. El encargo sirve para Terra o Luna; el nombre de Luna en el plan no cambia su alcance.

## Documentos de referencia

1. [Plan funcional por etapas](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).
2. [Guía visual](../design/GUIA_VISUAL_LUNA_2026-09-10.md).
3. [Mockups y alcance de las simulaciones](../design/experiencias-lectura-v1/README.md).
4. [Registro de ejecución](ESTADO_EXPERIENCIAS_LECTURA.md).

La base de diseño y sus capturas se subieron a GitHub en `073f658`. Comprobar siempre el estado real del checkout al empezar; preservar cambios posteriores.

## Encargo para copiar

> Trabaja en el proyecto Santa Biblia. Lee `docs/implementation/INICIAR_AQUI.md`, el plan funcional enlazado y las secciones de Home de la guía visual. Ejecuta únicamente 0A y etapa 1 del plan: implementar la primera tarjeta del Home según los mockups entregados. Con historial, mostrar “Continuar leyendo” y “Elegir una lectura”, iguales y centrados respecto de toda la tarjeta en móvil, con los tonos azules suaves definidos. Sin historial, mostrar una sola acción “Elegir una lectura”. Mantener el selector compartido y el progreso real. Conservar el hero y su atmósfera; sólo aplicar el retoque limitado que permita el plan y que tenga una mejora visual comprobable. Usa el código actual y los assets existentes, adaptando la referencia visual a React, sin trasladar el código simulado del prototipo a producción. Comprueba 320, 390, 768 y 1440 px, claro/oscuro, con y sin historial y texto ampliado. Ejecuta las comprobaciones pertinentes, guarda capturas comparables y actualiza el registro de ejecución. Entrega la etapa terminada con su commit y el resultado de las verificaciones. Deja 0B, audio, temas, curso y biblioteca pendientes para encargos posteriores; no rehagas el plan ni vuelvas a generar las ilustraciones.

## Continuación

Después de cerrar la tarjeta, encargar una etapa concreta cada vez usando el mismo plan. Para elegir la siguiente, consultar dependencias y registro; no repetir una etapa ya terminada.

Pendientes externos documentados: reproducción real del audio durante la integración de Reavivados y edición reutilizable para cada libro antes de importar su texto. Ninguno impide comenzar la etapa 1.

## Elección de modelo para este proyecto

Recomendación de trabajo: **Terra** para llevar la implementación completa; razonamiento medio para empezar por la tarjeta, alto para la resolución de audio, nuevas rutas e integración de progreso. **Luna** es una alternativa para etapas pequeñas de CSS, textos y ajustes visuales con la referencia ya fijada. Es una recomendación para este alcance, no una garantía de rendimiento.

La documentación oficial caracteriza [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) por su equilibrio entre capacidad y coste, y [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) por su orientación a cargas sensibles al coste. Los precios de API no se convierten directamente en consumo de cuota de Codex.
