# Footer compacto y cabecera legible

Publicar y verificar cada ajuste por separado; conservar contenidos, acciones y distribución del home.

| Etapa | Cambio | Estado |
| --- | --- | --- |
| Footer | Identidad y descripción a la izquierda, tres acciones a la derecha cuando hay espacio. En móvil, bloque centrado más compacto con espacio seguro sobre la navegación | Publicado: `73f20cb` |
| Cabecera y aire | Dar a la barra del inicio un fondo uniforme que mejore su lectura en día/noche, sin atenuar texto ni iconos. Aumentar suavemente el espacio del hero (+28 px en escritorio y +24 px en móvil) | Completado |

Se interpreta la petición sobre opacidad según su propósito explícito: mayor legibilidad como las páginas interiores. Se controla el relleno del fondo, manteniendo todo el contenido a opacidad completa.

Las acciones conservan 44 px de altura mínima, textos y traducciones; los modales mantienen sus funciones y retorno de foco. La disposición horizontal del footer depende de espacio en rem para apilarse al ampliar texto.

Footer validado: de 134 a 61 px en escritorio; 166 px en móvil, incluyendo 72 px reservados para la navegación inferior. Los tres enlaces caben en una fila incluso a 320 px. Doce E2E de información y texto ampliado aprobados, seis E2E de información repetidos tras ajustar el margen lateral de los botones; lint/build/contrato/corpus correctos y revisión visual 320–1440 px.

Cabecera del inicio: relleno independiente al 92 % del color de superficie, de borde a borde, con contenido a opacidad completa. Respeta la preferencia de transparencia reducida con relleno opaco; no incorpora otra imagen ni modifica las cabeceras interiores. El hero de 1440 × 900 pasa de 560 a 588 px, manteniendo el tamaño de la promesa y del panel, con más margen superior e inferior. En móvil pasa de 936 a 960 px con las mismas condiciones de lectura.

Validación de la segunda etapa: 51 E2E aprobados y nueve omisiones esperadas de plataforma; lint/build/contrato/corpus correctos. Revisión día/noche en 320, 390, 768 y 1440 px, texto ampliado, menús, descarga única de fotografía y estabilidad de altura entre promesas.
