# API pública de textos bíblicos

Los datos de `https://www.santabiblia.cloud/data/` son públicos y permiten solicitudes desde otros sitios (CORS).

## Catálogos

- `GET /data/versions.json`: versiones disponibles. Usa el campo `id` en las rutas de lectura.
- `GET /data/books.json`: libros, abreviaturas, cantidad de capítulos e identificador de archivo.

Actualmente están disponibles `rva2015` (RVA2015), `nbla` (NBLA) y `kjv` (KJV, en inglés).

## Capítulo

`GET /data/{version}/{archivo-del-libro}/{capítulo}.json`

Por ejemplo: `/data/nbla/43_juan/3.json`. Devuelve una lista de versículos para ese capítulo.

## Libro consolidado

`GET /data/{version}/{archivo-del-libro}.json`

Por ejemplo: `/data/nbla/43_juan.json`. Devuelve `{ version, book, name, chapters }`; cada capítulo contiene `{ chapter, verses }`. Este formato conserva la ruta RVA2015 existente y queda disponible para cada versión del catálogo.
