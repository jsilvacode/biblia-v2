# Footer editorial · 18 de octubre de 2026

La referencia aportada orienta la jerarquía visual: una fila de navegación con separadores discretos y una línea secundaria de información. Se conserva exclusivamente la información existente del proyecto.

- Primera fila centrada: Acerca de, Ayuda y Apoya el proyecto. Tipografía UI de 14 px en escritorio/tablet, separadores de 1 × 12 px y objetivos de interacción de al menos 44 px.
- Segunda fila: icono, Santa Biblia v3.0 y descripción del proyecto. Nombre y descripción comparten línea desde 768 px; se apilan en móvil. El autor permanece únicamente dentro de Acerca de.
- Superficie de tonos cálidos en día y oscuros en noche, línea superior fina, espacio vertical moderado y el mismo ancho de contenido del resto de la página.
- Se mantienen los tres modales centrados, cierre, bloqueo de scroll y retorno del foco. El orden del DOM sigue el visual: navegación primero, identidad después.

Validación: 25 E2E correctos y nueve omisiones esperadas por plataforma en Acerca de y navegación. Incluyen tres idiomas, ambos temas, controles táctiles, modales y composición responsive. Revisión visual adicional en 320, 390, 768, 1024 y 1440 px, día/noche y texto al 200%, sin desbordamientos. Altura de escritorio: 117,39 px. Tablet: 169,39 px y móvil: 191,89 px, incluyendo su reserva inferior para navegación. Lint, build, contrato público y corpus correctos.
