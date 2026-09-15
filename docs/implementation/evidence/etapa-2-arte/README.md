# Evidencia visual — etapa 2 · Arte e identidad

Estas capturas verifican los artes originales aplicados a las tarjetas de Reavivados por su Palabra y La Fe de Jesús en el Home. Se generaron con el servidor local de Vite, Chromium y movimiento reducido.

La matriz cubre 320, 390, 768 y 1440 px; temas claro y oscuro; con y sin historial; y texto ampliado en cada ancho. Los destinos de ambas tarjetas se verifican aparte mediante Playwright: Reavivados conserva el lector bíblico actual y el curso conserva su índice.

Para repetirlas:

```sh
SANTA_BIBLIA_CAPTURE_STAGE=etapa-2-arte node scripts/capture-home-stage1.mjs
```

Los WebP de producción proceden de `docs/design/experiencias-lectura-v1/assets/`: `rpsp-landscape-v1.webp` y `course-invitation-v1.webp`. Sus prompts y maestros siguen allí; sólo los WebP optimizados se sirven en `public/assets/`.
