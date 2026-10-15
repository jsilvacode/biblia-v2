# Home: composición estable y promesas diarias

## Lectura rápida

El selector y el buscador comparten ancho y un tratamiento de borde, fondo y radios. Las tres lecturas recientes se presentan en una fila desde 768 px y como enlaces compactos apilados en móvil. Cada enlace conserva el versículo de reanudación y su acceso mediante teclado.

La vista previa de búsqueda utiliza el posicionamiento del selector: abre hacia el espacio disponible y limita su altura a 288 px. Al desplegarla se conserva la altura del panel. Cierra con Escape o al salir; el modal de capítulos devuelve el foco al resultado que lo abrió.

El panel tiene una altura estable, incluso antes de que exista historial. En ese caso muestra una indicación breve, sin inventar lecturas.

## Calendario de promesas

Se revisaron las 365 entradas y se ajustaron 44 referencias, conservando 365 pasajes distintos y todos los días del calendario. Se eligieron versículos completos de esperanza, consuelo, confianza y promesa; los pasajes más breves se acompañan de versículos contiguos cuando aportan contexto.

Antes, los textos NBLA medían entre 39 y 609 caracteres. La selección revisada mide aproximadamente 60–240 caracteres en NBLA y tiene un máximo de 260 en cualquiera de las tres versiones disponibles. Las pruebas validan que cada rango exista completo en NBLA, RVA2015 y KJV. El texto se obtiene de esas versiones; la limpieza de presentación conserva las comillas que forman pares dentro del pasaje.

El acceso «Leer capítulo» mantiene la cita completa visible encima y abre el contexto de la promesa. Compartir utiliza la referencia revisada y la versión elegida.

## Alturas

Hero y panel reservan su espacio mediante alturas por tamaño de pantalla. La cita dispone de un área propia y tres escalas tipográficas según su longitud. Esto conserva la posición de la referencia, las acciones y la sección siguiente entre días y durante la carga.

El mínimo intrínseco del hero permite crecer cuando una persona amplía mucho la tipografía del navegador, conservando completos el texto y sus acciones.

Ejemplos con tamaño raíz de 16 px:

| Pantalla | Hero | Panel |
| --- | ---: | ---: |
| 320 × 568 | 624 px | 496 px |
| 390 × 844 | 584 px | 496 px |
| 640 × 800 | 528 px | 464 px |
| 768 × 1024 | 528 px | 384 px |
| 1440 × 720 | 464 px | 384 px |
| 1440 × 900 | 608 px | 384 px |

## Validación

- 185 pruebas unitarias aprobadas, incluidos rangos, límites de extensión, calendario completo y formato de citas.
- 68 pruebas de navegador aprobadas; 8 casos no aplicables se omiten según el dispositivo.
- Revisión de las 365 promesas en tres versiones, ocho tamaños de ventana y motores Chromium/WebKit: 17.520 composiciones, sin citas que excedan el área reservada.
- Comprobación visual de día/noche y del historial en desktop y móvil.
- Lint y compilación de producción aprobados, junto con las auditorías del corpus y del contrato público de datos.
- Evidencia numérica: `evidence/home-promises-layout-2026-10-14.json`.
