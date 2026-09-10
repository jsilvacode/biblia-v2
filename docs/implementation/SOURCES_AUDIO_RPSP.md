# Reavivados: fuentes y evidencia técnica

Consulta: 10 de septiembre de 2026. Este anexo conserva hallazgos, no otra arquitectura. El contrato y las rutas vigentes están en el [plan principal](PLAN_EXPERIENCIAS_LECTURA_LUNA_2026-09-10.md), sección 4.

## Fuente primaria

El [archivo oficial de Nuevo Tiempo](https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/) anuncia su [RSS](https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/feed/). La consulta devolvió HTTP 200, `application/rss+xml`, 194104 bytes, `ETag` y `Last-Modified`. El snapshot contenía 80 entradas entre el 20/06 y el 10/09/2026, con `title`, `link`, `guid`, `pubDate` y `enclosure` con URL, longitud y MIME.

El snapshot salta del 4 al 7 de septiembre: no permite inferir una secuencia diaria por posición. Tampoco demuestra que los episodios omitidos no existan fuera del feed. Aparecen referencias como `Salmo 34` y `|Ester 9|`: normalizar singular, acentos y espacios; comparar libro y capítulo completos. Estos datos describen la respuesta consultada, no garantizan el comportamiento futuro del proveedor.

## Episodio de referencia

La [página aportada por el usuario, Salmo 34](https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/gustad-y-ved-que-bueno-es-el-senor-salmo-34-reavivados-por-su-palabra/) y su enclosure apuntan al mismo medio:

```text
https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3
```

Los [metadatos WordPress de ese episodio](https://www.nuevotiempo.org/wp-json/wp/v2/audio/38751) indican ID `38751`, `date: 2026-09-10T01:00:00` y `date_gmt: 2026-09-10T04:00:00`. Los campos inspeccionados no contienen MP3; `modified` tampoco representa el día de lectura.

HEAD al [medio oficial](https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3) devolvió 200, `audio/mpeg`, 26576042 bytes y `Accept-Ranges: bytes`. HEAD con `Range: bytes=0-1` devolvió 206 y `Content-Range: bytes 0-1/26576042`. No hubo redirección observada ni `Access-Control-Allow-Origin` para el origen de prueba de Santa Biblia. **No se descargó el MP3 ni se probó reproducción real.** Estos encabezados respaldan la propuesta, pero no acreditan funcionamiento en todos los navegadores.

La grafía **Bruno Raso** aparece en la [ficha oficial de Tito 2](https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/ensenanza-de-la-sana-doctrina-tito-2-reavivados-por-su-palabra/). No todas las descripciones del feed nombran al presentador; no atribuir un episodio específico sin confirmación.

## Fallback WordPress/HTML acotado

La [consulta oficial por intervalo](https://www.nuevotiempo.org/wp-json/wp/v2/audio?search=Reavivados&after=2026-09-07T00%3A00%3A00&before=2026-09-11T00%3A00%3A00&per_page=10&_fields=id,date,date_gmt,slug,link,title) permite obtener candidatos. Este es el procedimiento de implementación cuando RSS no resuelve:

1. Consultar `/wp-json/wp/v2/audio` con `search=Reavivados`, intervalo que cubra el día solicitado y `per_page=10`; pedir sólo `id,date,date_gmt,slug,link,title`. Filtrar la fecha civil exacta después de recibir candidatos.
2. Admitir únicamente enlaces HTTPS cuyo host sea `www.nuevotiempo.org` y cuyo pathname empiece con `/audio/reavivados-por-su-palabra-2/`. Normalizar y comparar referencia exacta con el calendario.
3. Si queda una sola coincidencia, obtener esa página canónica y extraer su `<audio src>` o `<source src>`. No ejecutar HTML ni insertarlo en React. Si hay ambigüedad, devolver estado de indisponibilidad y permitir override editorial documentado.
4. Admitir inicialmente medios de `https://vod.nuevotiempo.org/`. Validar también destinos de redirección; un cambio de CDN requiere actualizar la lista con evidencia.
5. Máximo tres peticiones por resolución: RSS, API y una página. Hasta 1 MB por documento, timeout de 6 s por petición y presupuesto total de 12 s. Sin paginación ilimitada ni búsqueda de todo el archivo. Son límites de diseño, no límites anunciados por Nuevo Tiempo.

No construir URLs por el patrón de nombre de archivo. Ni un feed truncado ni una publicación tardía justifican reproducir otro día bajo el título de hoy.

## Reproducción y calendario

Usar un `HTMLAudioElement` sin `crossOrigin`, como describe [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/crossOrigin). El RSS se resuelve del lado del servidor; el MP3 fluye directamente del proveedor al navegador. No implementar fetch→blob, Web Audio, proxy ni almacenamiento offline del audio. Comprobar inicio por gesto, pausa y avance real en Safari/iOS y Chrome/Android.

El [programa oficial de Revival & Reformation](https://www.revivalandreformation.org/bhp) mostraba Salmos 34 durante la revisión. Sus [calendarios oficiales](https://www.revivalandreformation.org/bhp/printable-reading-schedules) son la referencia para incorporar otros años. El calendario instalado cubre 2026; no extrapolarlo silenciosamente.

Seguir el manejo de caché del plan y la [documentación oficial de Vercel](https://vercel.com/docs/caching/cache-control-headers). La memoria de una función es sólo optimización; el respaldo versionado contiene metadatos exactos, nunca audio.

Se observó acceso público al medio y su publicación en RSS; no se encontró una licencia abierta específica del audio. Mantener fuente y enlace al episodio, sin llamarlo dominio público ni redistribuir el archivo. Los fixtures de pruebas guardarán campos mínimos de metadatos, sin descripciones completas.
