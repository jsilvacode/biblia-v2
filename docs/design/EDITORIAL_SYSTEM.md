# Sistema editorial de Santa Biblia

El sitio usa una escala contenida y un mismo marco exterior. Las páginas de herramientas comparten una medida interior; los textos largos conservan una columna de lectura más breve dentro de ese marco.

## Medidas compartidas

| Uso | Variable | Medida máxima |
| --- | --- | --- |
| Cabecera, banners y marco de página | `--content-max-width` | 62rem / 992px |
| Tarjetas de inicio, listados, formularios y notas | `--content-inner-width` | 56rem / 896px |
| Versículos, declaraciones y lecciones | `--reading-max-width` | 46rem / 736px |
| Márgenes exteriores | `--layout-gutter` | 18px móvil; 24px tablet; 32px escritorio |
| Espacio interior de cabeceras | `--page-inset` | 16–48px, adaptable |

Son límites máximos: en móvil se usa el ancho disponible y cada bloque crece según su contenido. Los controles conservan un área de interacción de al menos 44px. La exposición ampliada de las creencias conserva el ancho del marco y su propio espacio interior.

## Jerarquía

- Títulos de página: `--font-size-page`, 30–42px.
- Títulos de sección: `--font-size-section`, 22–29px.
- Títulos de tarjeta: `--font-size-card`, 18–20px.
- Cuerpo editorial: `--font-size-editorial`, 17–18px.
- El lector mantiene el tamaño y el interlineado elegidos por la persona.

Inter se reserva para controles y metadatos; Lora para la lectura; Playfair Display para títulos. No añadir tamaños gigantes o anchos propios por página.

## Luz, papel y acentos

Las superficies normales usan los colores semánticos de `tokens.css`, con borde fino `--border`. Una textura de papel y una iluminación ambiental compartidas pertenecen al fondo general. Evitar capas de papel, sombras o brillos adicionales por cada sección.

Las cabeceras ilustradas comparten `--intro-min-height`, `--intro-padding-block` y `--intro-gradient`. Usar `PageIntro` cuando sea posible; cabeceras especializadas siguen esas mismas variables. El texto debe continuar legible sobre el degradado sin cajas opacas independientes.

Turquesa en el día y coral con arena en la noche permanecen como acentos. El cuerpo conserva sus tonos neutros y sobrios.

## Ilustraciones

Las tarjetas del inicio usan acuarela y grafito en composiciones panorámicas 2.8:1. Cada tema tiene una imagen propia y su versión nocturna pintada, elegida por `EditorialIllustration`. Los encuadres deben preservar los rostros y el motivo principal. No invertir colores para crear una versión oscura.

Los archivos v2 de lectura diaria, guía y fe se reutilizan en sus secciones y modales del footer. Su procedencia y prompts están en `docs/artwork/editorial-cohesion-v2.json`. Se generaron con la herramienta integrada ImageGen y se exportaron a WebP. Las imágenes de estas categorías se cargan al visitarlas y se conservan en caché, sin descargar de entrada todas las variantes de día/noche.
