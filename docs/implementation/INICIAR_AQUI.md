# Inicio de implementación — Santa Biblia

Actualizado el 16/09/2026. Las etapas 0A, 0B, 1 (primera tarjeta), 2 (arte e identidad), 3A (fuente de audio), 3B (reproductor), 3C (experiencia diaria), 4A (índice de la guía temática) y 4B (ficha temática) están cerradas e integradas en `main`. Consultar el [registro de ejecución](ESTADO_EXPERIENCIAS_LECTURA.md) antes de cambiar de etapa. El nombre de Luna en el plan no cambia su alcance.

## Documentos de referencia

1. [Plan funcional por etapas](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md).
2. [Guía visual](../design/GUIA_VISUAL_LUNA_2026-09-10.md).
3. [Mockups y alcance de las simulaciones](../design/experiencias-lectura-v1/README.md).
4. [Registro de ejecución](ESTADO_EXPERIENCIAS_LECTURA.md).

La base de diseño y sus capturas se subieron a GitHub en `073f658`. Comprobar siempre el estado real del checkout al empezar; preservar cambios posteriores.

## Continuación

Iniciar 5A como un índice: conservar las 20 lecciones, requisitos, progreso y destinos actuales, pero dar al recorrido de La Fe de Jesús su composición e identidad visual propia. No repetir 0A, 0B, 1, 2, 3A, 3B, 3C, 4A ni 4B.

Pendientes externos documentados: reproducción real del audio durante la integración de Reavivados y edición reutilizable para cada libro antes de importar su texto. Ninguno impide iniciar las etapas que no dependan de esas fuentes.

## Elección de modelo para este proyecto

Recomendación de trabajo: **Terra** para llevar la implementación completa; razonamiento medio para empezar por la tarjeta, alto para la resolución de audio, nuevas rutas e integración de progreso. **Luna** es una alternativa para etapas pequeñas de CSS, textos y ajustes visuales con la referencia ya fijada. Es una recomendación para este alcance, no una garantía de rendimiento.

La documentación oficial caracteriza [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) por su equilibrio entre capacidad y coste, y [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) por su orientación a cargas sensibles al coste. Los precios de API no se convierten directamente en consumo de cuota de Codex.
