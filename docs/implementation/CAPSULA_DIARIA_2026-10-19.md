# Este Día con Dios: cápsula diaria

Implementación local del 19 de octubre de 2026, basada en la [investigación del origen](../design/CAPSULA_ESTE_DIA_CON_DIOS_2026-10-19.md).

## Resultado

- Sección entre el bloque de apertura y «También en Santa Biblia», con fecha, título, autoría y enlaces oficiales.
- Portada ligera; el iframe de `youtube-nocookie.com` se crea al pulsar reproducir o elegir una miniatura. Ese gesto solicita reproducción dentro del mismo espacio, con controles y modo móvil. La pantalla completa sólo se activa desde el control del usuario. No hay iframe ni sonido al entrar en Inicio.
- Página `/este-dia-con-dios/YYYY-MM-DD`, reutilizando el mismo componente. Compartir y copiar conservan la fecha de la cápsula que se está mostrando.
- HTML social por fecha con título, crédito y miniatura, disponible para aplicaciones que no ejecutan JavaScript. La presentación final de la tarjeta depende de la aplicación receptora.
- Carrusel de los siete días anteriores, cargado al acercarse a la sección. Las miniaturas quedan a 10 px del reproductor y sus tarjetas miden como máximo la mitad de las tarjetas editoriales. Elegir una cápsula cambia el video dentro del mismo reproductor, conserva la URL actual y permite compartir el enlace de la fecha elegida. La galería permanece anclada a la semana de la cápsula principal.
- Encabezado y créditos compactos. Enlaces de interés, de izquierda a derecha: Este Día con Dios, Estudie la Biblia, Escuela Sabática y Diálogo Bíblico.
- Controles y estados en español, inglés y portugués; el video sigue siendo el original en español.

## Actualización y origen

`GET /api/daily-video?date=YYYY-MM-DD` consulta WordPress por fecha editorial y después el HTML del post para extraer el ID del iframe de YouTube. `history=1` añade las publicaciones de los siete días anteriores y su estado; resuelve sus IDs con concurrencia acotada y conserva entradas sin video resuelto para reintentarlas al seleccionarlas. No usa la última subida de YouTube ni interpreta el número de cápsula como día del año.

Se validan fechas reales, dominios, páginas y coincidencias únicas. Las consultas limitan redirecciones, cuerpos a 1 MB y duración total a ocho segundos. Se comparten peticiones simultáneas para la misma consulta. Caché CDN: 15 minutos para resultados confirmados y dos minutos para publicaciones pendientes; los errores no se almacenan.

Inicio sigue la fecha civil del dispositivo. Comprueba cambios de fecha cada 30 segundos y al recuperar el foco; vuelve a consultar publicaciones pendientes cada dos minutos y metadatos listos cada 15 minutos mientras la vista esté visible. Si se activó el reproductor, mantiene esa cápsula y, al cambiar el día, ofrece «Ver cápsula de hoy» para evitar interrumpirla.

## Disponibilidad y conservación

El catálogo incluido contiene las tres asociaciones verificadas del 17, 18 y 19 de octubre de 2026. Esas entradas conservan su ID incluso si cambia temporalmente la respuesta del proveedor. El navegador conserva hasta 15 respuestas confirmadas y puede recuperar la cápsula de la misma fecha si falla el origen. Se indica cuando esos datos no pudieron actualizarse.

Las demás fechas se resuelven automáticamente desde el catálogo público. No se añadió una base de datos externa: esas asociaciones futuras dependen de la conservación del post oficial y de la disponibilidad de YouTube. La memoria serverless sólo agrupa peticiones, no constituye un catálogo persistente. La ruta siempre fija la fecha y nunca sustituye una cápsula anterior por la de hoy.

Una fecha pendiente muestra su estado y permite reintentar o consultar anteriores. Una fecha inválida no consulta el servicio. La reproducción requiere conexión; no se descarga ni almacena el audiovisual en la PWA.

El servidor de desarrollo y preview atiende el nuevo endpoint. Vercel tiene las reglas para el endpoint y el HTML social antes del fallback de la SPA. El HTML social limita la consulta a 3,5 segundos y utiliza una tarjeta genérica sin caché si no puede resolver el episodio; la aplicación sigue disponible.

## Validación

- Pruebas de resolución por fecha, fuente, redirecciones, límites, cuerpos interrumpidos, errores, respaldo e historial.
- Pruebas de selección y cambio de fecha, medianoche con reproductor abierto, caché ante caída, compartir y cancelación.
- Pruebas del HTML social y regresiones de metadatos de versículos.
- Catorce casos E2E del nuevo recurso en móvil y escritorio: colocación, iframe diferido, selección en el mismo reproductor sin pantalla completa automática, fecha compartida al día siguiente, historial, publicación pendiente, fechas inválidas, temas, anchos de 320 a 1440 px y estabilidad durante la carga. Las dimensiones de las miniaturas y la separación del reproductor se comprueban en ambos temas.
- Regresiones del inicio, selector y lector; revisión visual con datos reales.
- Reproducción real de la cápsula #292 verificada en el navegador integrado, incluido el inicio con una sola acción y la pausa. Historial real de siete publicaciones verificado.
- El 20 de octubre se comprobó la actualización automática contra el origen: «Llamados para servir» (`kvs5zl0tZwo`) y las siete cápsulas anteriores, sin modificar el catálogo incluido.
- Los estados de carga y publicación pendiente también se comprueban a 320 px en ambos temas; el recuadro conserva el ancho de su columna y una altura mínima de 200 px.
- Compilación de producción, ESLint y auditorías del contrato público y corpus bíblico.

La publicación utiliza la integración existente de Vercel con `origin/main`, según la autorización del usuario. No se modificó el archivo de planificación previo del usuario.
