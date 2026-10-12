# Vidrio perceptible y barra del lector · 12/10/2026

El vidrio anterior se dibujaba: el contexto aislado contenía correctamente sus capas negativas. En modo claro los reflejos blancos sobre el papel casi blanco tenían muy poco contraste; la máscara de entrada reducía además el tramo compartido con el paisaje. Se conservan el ancho y la disolución final del manto, reforzando reflejo superior, luz diagonal, refracción fría/cálida y entrada suave en 32 px. El desenfoque pasa a 12 px.

El lector comienza con “Seleccionar libro” y “—”, sin capítulo ni apertura habilitados. Tras abrir otro pasaje vuelve a estar limpio. La marca queda alineada con Home; “Volver” y el selector están debajo de la barra de vidrio, en una banda del color de lectura. Se alinean horizontalmente en desktop y se apilan en móvil o texto ampliado.

## Evidencia

- [Manto claro desktop](webkit-mantle-1440-light.jpg), [oscuro desktop](webkit-mantle-1440-dark.jpg), [claro móvil](webkit-mantle-390-light.jpg), [oscuro móvil](webkit-mantle-390-dark.jpg).
- [Lector claro móvil](webkit-reader-390-light.jpg), [oscuro móvil](webkit-reader-390-dark.jpg), [claro desktop](webkit-reader-1440-light.jpg), [oscuro desktop](webkit-reader-1440-dark.jpg).
- `layouts.json`: 40 combinaciones Home/lector en Chromium y WebKit 26.5, 320/390/768/1440 px y ambos temas, más lector EN/PT al 200% en 320/1024 px. Sin desbordes, solapes o selección precargada en el lector.
- `paint-report.json`: comparación A/B de pintura real en ambos motores, 390/1440 px y ambos temas. En Chromium claro la diferencia media del manto pasa de 0,55 a 2,83 niveles RGB en móvil y de 0,98 a 5,28 en desktop; la revisión visual confirma reflejos perceptibles y disolución del fondo. El JSON sólo conserva la referencia anterior Chromium, sin atribuir significado a capturas WebKit tomadas antes de esperar el repintado.

## Verificación

Lint, 7 unitarios afectados y build con auditorías de datos aprobados. E2E final: 28 aprobados y 4 omisiones previstas entre Home, vidrio, teclado, listas acotadas, cabecera, retorno, resaltados y navegación inmersiva. La suite completa de 122 aprobados/20 omisiones del commit precedente sigue siendo la referencia para flujos ajenos a estos ajustes. La navegación móvil hacia el selector limpio también se comprobó durante su implementación.

Capturas de emulación; no equivalen a una prueba en un iPhone físico. La publicación se verifica contra el SHA exacto después del push.
