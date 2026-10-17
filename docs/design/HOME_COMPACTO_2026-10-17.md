# Home más compacto

Fecha: 17 de octubre de 2026.

Conservar el acabado Ópalo mate, las tipografías y los flujos existentes. Publicar y verificar cada etapa antes de modificar la siguiente.

| Etapa | Cambio | Estado |
| --- | --- | --- |
| Footer | Reducir padding y distancia entre identidad y enlaces; conservar acciones de 44 px, tres modales y espacio seguro sobre la navegación móvil | Publicado: `6633955` |
| Tarjetas y título | Dar algo más de ancho al contenido editorial y reducir altura de imagen, padding y separaciones; centrar «También en Santa Biblia» con tipografía de título | Publicado: `e9d419f` |
| Apertura | Colocar la promesa y el único panel de lectura en dos columnas de escritorio; reducir altura y mantener el orden vertical en móvil, accesibilidad, búsqueda, acordeón y descarga única del paisaje | Completado |

«Este texto centrado» se interpreta como el título existente «También en Santa Biblia», sin cambiar su redacción ni las traducciones.

Comprobaciones: tamaños móvil/tablet/escritorio, día/noche, textos traducidos, texto ampliado, promesas de distintas extensiones, selección y búsqueda. Mantener una sola instancia del panel al cambiar de tamaño de pantalla.

Footer: cinco E2E aprobados y una omisión esperada, lint/build/corpus correctos; artefacto público verificado.

Tarjetas: cuatro E2E editoriales aprobados en móvil/escritorio y tres idiomas; lint/build/corpus correctos y artefacto público verificado. A 1440 px, cada tarjeta pasa de 350,7 × 328 a 384 × 296,8 px; a 390 px, su altura pasa de 327,7 a 288,3 px. Se ajusta el encuadre de La Fe de Jesús para conservar el rostro al reducir la foto.

Apertura: dos columnas desde 1100 px cuando hay al menos 58 rem de ancho disponible; al ampliar texto, la misma instancia del panel vuelve al orden vertical conservando la búsqueda. A 1440 × 900 px la apertura pasa de 1032 a 560 px. No se recorta ninguna promesa y la altura permanece estable entre textos cortos, medianos y largos.

Se incorpora la última indicación de espacio: el panel queda centrado respecto al verso y separado del borde inferior del hero, con al menos 40 px en tablet/escritorio y 24 px en móvil. A 1440 px el margen real bajo el panel es de 56 px; las tarjetas mantienen su separación de sección de 56 px en escritorio y 44 px en móvil. Se conservan las cuatro esquinas Ópalo y el paisaje termina en la base de toda la apertura.

Validación final: 225 E2E aprobados y 19 omisiones esperadas por plataforma, lint/build/contrato público/corpus correctos. Comprobación adicional en seis anchos (320–1440 px), tres idiomas y texto al 100 % y 200 %, además de revisión visual en día/noche y descarga única de la fotografía. La publicación de esta etapa se realiza después de las dos anteriores.
