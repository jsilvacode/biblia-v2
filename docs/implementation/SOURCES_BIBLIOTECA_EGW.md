# Biblioteca: fuentes de las ediciones españolas

Consulta: 10 de septiembre de 2026. Alcance: identificar una fuente completa y documentada para el lector solicitado. La [sección 7 del plan](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md) fija el comportamiento del producto.

## Resultado

En la búsqueda realizada no se encontró un repositorio que reúna texto español completo, edición identificada y permiso verificable de reutilización de esa edición. No es una afirmación sobre todas las ediciones históricas posibles. Un repositorio público o un descargador MIT no acreditan por sí solos derechos del texto obtenido.

Se propone empezar por **El Camino a Cristo** cuando se cierre la fuente. Mientras tanto, la modalidad concreta disponible es un catálogo con enlaces oficiales identificados como externos. La investigación no autoriza ni realiza contacto con editoriales, extracción masiva o publicación de corpus.

## Fuentes oficiales

| Edición | Evidencia consultada | Decisión para este proyecto |
|---|---|---|
| El Camino a Cristo, ID 1749 | [Ficha](https://m.egwwritings.org/es/book/1749/info): Ellen Gould White, español, Pacific Press, 1993, 126 páginas bibliográficas. [Índice](https://m.egwwritings.org/es/book/1749/toc): prólogo y 13 capítulos. | Edición identificada; no importar sin resolver condiciones de reutilización. |
| El Deseado de Todas las Gentes, ID 174 | [Ficha](https://m.egwwritings.org/es/book/174/info): español, Pacific Press, 1955, 812 páginas bibliográficas. [Índice](https://next.egwwritings.org/book/b174): prefacio, 87 capítulos y apéndice. | Falta licencia verificable de la edición/traducción para el uso propuesto. |
| El Camino A Cristo, ID 14154 | [Edición en español moderno](https://text.egwwritings.org/book/b14154): 13 capítulos con títulos diferentes. | No mezclar con 1749; no se identificó edición/traductor/licencia suficientes en lo examinado. |

El [PDF oficial de Camino a Cristo](https://media4.egwwritings.org/pdf/es_CC%28SC%29.pdf) tiene 94 páginas físicas, distintas de su paginación bibliográfica. En su página física 5 figura una licencia de uso personal que excluye republicación, distribución y derivados, además del aviso © 2012 Ellen G. White Estate. Es evidencia de ese archivo, no una conclusión general sobre cualquier traducción histórica.

El [aviso legal de White Estate](https://whiteestate.org/legal-notice/) y la [EULA](https://whiteestate.org/legal-notice/eula/) no proporcionaron un permiso de republicación del corpus en una app de terceros. Un enlace a la obra oficial es una salida distinta de importar su texto. No se verificó un widget/API pública con autorización para reproducir una edición completa dentro de Santa Biblia.

Limitación de acceso: algunas fichas devolvieron 403 a consulta automatizada y se contrastaron mediante sus resultados indexados; PDF y avisos legales sí se consultaron directamente durante la investigación. No se eludieron restricciones de acceso.

## Repositorios inspeccionados

| Repositorio | Contenido observado | Por qué no cierra la fuente |
|---|---|---|
| [IshoM21/camino-a-cristo-react-vite](https://github.com/IshoM21/camino-a-cristo-react-vite) | `public/capitulos.json` enumera prólogo y 13 capítulos. La muestra `public/assets/resumenes/1.txt` es un resumen. Árbol `199ddd2ac582fc01960a47d239724de82ca83db0`. | No es texto íntegro; no se encontró LICENSE ni identificación suficiente de edición. |
| [hortizrd/camino-a-cristo](https://github.com/hortizrd/camino-a-cristo) | Repositorio vacío al consultar. | Sin corpus. |
| [Charlieqinghua/steps-to-christ](https://github.com/Charlieqinghua/steps-to-christ) | Markdown de 13 capítulos; muestra en chino. | No es español; no se encontró LICENSE. |
| [egl1/booksbyellenwhite](https://github.com/egl1/booksbyellenwhite) | PDFs anunciados para ambas obras; árbol `25a54db2fd2f287bbca4b88ed42b3a89f0147ce0`. | No se verificó corpus español ni licencia; no se descargaron esos PDFs. |
| [hcsp-spuc/desire-of-ages](https://github.com/hcsp-spuc/desire-of-ages) | Sitio en inglés; árbol `5c93534b2d0cb44efd1a9cdea121dc859aaeb65d`. | No cubre la edición española; no se encontró LICENSE. |
| [clove3am/egw-downloader](https://github.com/clove3am/egw-downloader) | Herramienta de extracción/conversión con [licencia MIT](https://github.com/clove3am/egw-downloader/blob/main/LICENSE). | La licencia corresponde al programa, no demuestra autorización del texto descargado. |

Esta lista documenta candidatos revisados, no un inventario exhaustivo de GitHub. No reconstruir libros juntando citas de repositorios de Escuela Sabática ni completar omisiones con paráfrasis.

## Evidencia que desbloquea la importación

Registrar en `docs/content-sources/egw.md`, durante la etapa 6A: obra, edición, idioma, traductor/editorial si constan, año, URL y revisión exactas, titular o fundamento documentado de dominio público, licencia/permiso y atribución. Debe cubrir la edición concreta y el uso propuesto: servir texto en web, transformación de formato y, si corresponde, repo público y caché offline.

Si existe permiso privado, conservarlo fuera del repositorio público y publicar sólo atribución autorizada. Preparar una eventual solicitud no autoriza enviarla. La ausencia de fuente afecta la importación de ese título; no detiene Home, Reavivados, temas ni curso.

Una fuente apta se fija por revisión/checksum, se importa por capítulos y se audita contra su índice. No usar como expectativa de longitud el número de páginas del PDF. Prólogos, apéndices, notas y cubiertas pueden tener condiciones propias; incluir sólo el material cubierto por la fuente elegida.
