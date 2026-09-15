# Inicio de implementación — Santa Biblia

Actualizado el 15/09/2026. Las etapas 0A, 1 (primera tarjeta) y 0B (cobertura de búsqueda) están cerradas e integradas en `main`. Consultar el [registro de ejecución](ESTADO_EXPERIENCIAS_LECTURA.md) y las dependencias del plan antes de escoger una sola etapa pendiente. El nombre de Luna en el plan no cambia su alcance.

## Documentos de referencia

1. [Plan funcional por etapas](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).
2. [Guía visual](../design/GUIA_VISUAL_LUNA_2026-09-10.md).
3. [Mockups y alcance de las simulaciones](../design/experiencias-lectura-v1/README.md).
4. [Registro de ejecución](ESTADO_EXPERIENCIAS_LECTURA.md).

La base de diseño y sus capturas se subieron a GitHub en `073f658`. Comprobar siempre el estado real del checkout al empezar; preservar cambios posteriores.

## Encargo para copiar

> Trabaja en el proyecto Santa Biblia. Lee `docs/implementation/INICIAR_AQUI.md`, el plan funcional enlazado, el registro de ejecución y el código actual de búsqueda. Ejecuta únicamente la etapa 0B: cobertura de búsqueda bíblica. Elimina el corte silencioso de 100 resultados mediante una lista paginada o “Ver más” que muestre el total, y comparte el mismo contrato entre `SearchPage` y `BibleNavigator`. La coincidencia debe usar palabras completas normalizadas y exigir todas las palabras de una frase; no usar sinónimos automáticos. Una consulta nueva o limpiada debe descartar resultados antiguos. Conserva la apertura de referencias, el selector compartido, las rutas, el historial/progreso y los estilos que acaba de cerrar la etapa 1. Añade sólo pruebas de comportamiento real: “mundo” no debe encontrar “inmundo”, una frase puede coincidir con palabras separadas, más de 100 resultados debe ser accesible y un cambio/limpieza de consulta no debe mostrar resultados viejos. Ejecuta las comprobaciones pertinentes, actualiza el registro de ejecución y entrega la etapa con su commit y evidencias. Deja arte, audio, Reavivados, temas, curso y biblioteca pendientes; no rehagas el plan, la tarjeta ni las ilustraciones.

## Continuación

Encargar una sola etapa concreta usando el mismo plan. Para elegirla, consultar dependencias y registro; no repetir 0A, 0B ni 1.

Pendientes externos documentados: reproducción real del audio durante la integración de Reavivados y edición reutilizable para cada libro antes de importar su texto. Ninguno impide iniciar las etapas que no dependan de esas fuentes.

## Elección de modelo para este proyecto

Recomendación de trabajo: **Terra** para llevar la implementación completa; razonamiento medio para empezar por la tarjeta, alto para la resolución de audio, nuevas rutas e integración de progreso. **Luna** es una alternativa para etapas pequeñas de CSS, textos y ajustes visuales con la referencia ya fijada. Es una recomendación para este alcance, no una garantía de rendimiento.

La documentación oficial caracteriza [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) por su equilibrio entre capacidad y coste, y [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) por su orientación a cargas sensibles al coste. Los precios de API no se convierten directamente en consumo de cuota de Codex.
