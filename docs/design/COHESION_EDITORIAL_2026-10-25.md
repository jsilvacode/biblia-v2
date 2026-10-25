# Cohesión editorial e ilustraciones de Santa Biblia

25 de octubre de 2026. Integración aprobada por el usuario para origin/main.

## Alcance publicado

Paleta marfil y pizarra, textura tenue de papel, jerarquía de títulos y superficies compartidas. Se conserva la estructura y los recorridos existentes. Biblia, Buscar, Guardados y Guía reciben aperturas ilustradas; Reavivados y La Fe de Jesús integran sus ilustraciones en sus encabezados. Las tarjetas de Inicio reutilizan el arte de su sección.

El paisaje principal v7 representa un campo abierto con sendero y horizonte bajo. Conserva el balance cálido/azul gris del paisaje anterior y sustituye el lago y la montaña a petición del usuario. Mantiene las diez variantes AVIF/WebP, el picture y la precarga coordinada.

## Arte original

Ilustraciones y paisaje generados con ImageGen para este proyecto. Los WebP se codificaron sin cambiar la composición; las variantes del paisaje usan recortes responsivos. No se reutilizaron imágenes del libro de Creencias ni se añadió una licencia abierta distinta de la del repositorio.

| Archivo | Tema | Tamaño | SHA-256 |
| --- | --- | --- | --- |
| daily-reading-v1.webp | daily-reading | 1536 × 1024; 131962 bytes | `528371674ff73a6ac4fe1042cd307554cfd0fc61f75b004f7d08ef88166d7a0a` |
| guidance-v1.webp | guidance | 1536 × 1024; 139828 bytes | `ac3753fa1e2d08ffec19d83243b6a73d6dfe040adbb4555ebdc9ab5a64554272` |
| faith-v1.webp | faith | 1536 × 1024; 139668 bytes | `90e24d97b8de353adeb099ae3eddd5e38e757f56a3b6526e6dc0bb53ee307303` |
| bible-library-v1.webp | bible-library | 1536 × 1024; 101104 bytes | `69c530df8685bac18b7fbdb2e9fa9205f98a5943ee6f27383163a38d8820155b` |
| search-v1.webp | search | 1536 × 1024; 124826 bytes | `acd284522250f2ca4f23db84d59d864d1a27ff31bd707c7aca3e9015b9ee2ed5` |
| saved-v1.webp | saved | 1536 × 1024; 94972 bytes | `fbfb70408eb65b65d7fd489a63e131cbf6bfc6ea51e5517c7fb2b1b1eb8624bb` |

Dirección de arte: lápiz visible y acuarela diluida sobre papel marfil; azules pizarra, arena y pequeños acentos cálidos; contornos abiertos y espacio sin pintar. Los PNG maestros y el registro completo de generación se conservan en el proyecto de trabajo de 28 creencias.

## Verificación

- 334 pruebas unitarias de 54 archivos correctas en la copia de revisión; ESLint correcto, excluyendo solo la caché local de Vite de esa copia.
- Seis páginas revisadas en 1280, 390 y 320 px y en tema oscuro móvil, sin desbordes. Las cuatro aperturas con img cargan sus archivos; las dos con fondo CSS se revisaron visualmente.
- Tarjetas, precarga y fuentes del paisaje v7 comprobadas en el navegador. Las acciones, progreso, audio, búsqueda y referencias mantienen sus componentes y lógica.
- Repositorio real verificado antes de publicar: 334 pruebas, lint, compilación PWA, contrato público (198 libros agregados, 3567 capítulos de traducción y 1189 de comentario) y auditoría del corpus correctos.

## Siguiente etapa, posterior a esta publicación

1. Tratar los títulos como mini banners con arte extendido por el contenedor.
2. Dar identidad a los modales de información del footer.
3. Alternar Antiguo/Nuevo Testamento en el selector compartido y abrir en el libro actual, también en lectura inmersiva.
4. Integrar el arte al ambiente nocturno o crear variantes oscuras.

Estas adecuaciones quedan separadas de la integración aprobada. El componente de las 28 creencias se retoma después de completar esta revisión de la Biblia.
