# Blue-green champagne-dawn hero · 2026-10-17

Tool: built-in `image_gen` with one call for the new panoramic landscape and one reference-based call for the portrait reframe. No CLI/API fallback. Both outputs viewed and inspected. Nature-only photograph assets, no UI or text baked in. Replaces the strongly amber v5 river-valley composition with a distinct still alpine lake, blue-slate mountain shadows, restrained sage headlands and champagne dawn illumination.

## Selected original paths

- Desktop: `/Users/zeus/.codex/generated_images/01a14b6d-b2b0-7aa3-800e-0fde6275a4d1/exec-d1b05d23-6ae8-4ccd-af22-cfe895e65128.png`
- Portrait: `/Users/zeus/.codex/generated_images/01a14b6d-b2b0-7aa3-800e-0fde6275a4d1/exec-0e91d9b1-82fc-4773-83cb-2e700b11ebb6.png`

The tool was asked for maximum native detail, ideally UHD. Actual pixel dimensions are reported below; no claim of 4K or artificial enlargement.

## Desktop prompt (exact)

Use case: photorealistic-natural.
Asset type: original cinematic landscape photograph for the full-width hero of a premium Bible reading website. Output the clean photograph alone, no UI or typography. Wide 16:9 landscape, maximum native detail available, ideally 3840 x 2160.
Primary request: a different inspiring alpine landscape centered on a vast still mountain lake at the first light of dawn. Monumental sculpted granite and lightly snow-dusted mountain peaks rise beyond the lake, their upper edges touched by elegant champagne-gold sunlight. The lake has subtle steel blue and muted turquoise reflections, a few softly sage-green wooded headlands and small pale stone shores. Layers of natural mist drift across the far water and receding mountain foothills. Epic scale and reverent stillness, natural photographic realism with exquisite rock, water and atmospheric detail.
Composition: panoramic elevated establishing view. Place the main dramatic mountain massif around 53 percent across and 20 to 35 percent down, so its summit remains visible between and above two website content columns. The leftmost 40 percent should be a particularly calm softly luminous field of warm ivory mist and pale distant silhouettes over the lake; it will hold dark verse typography, so no crisp black trees, cluttered foreground rocks, glaring sun disk, bright streaks or hard contrast edges there. Allow the lower half and right edge to reveal readable lake water, a restrained sage-green shoreline and layered atmospheric mountains. Keep sky to approximately the upper quarter with soft quiet cloud veils rather than busy clouds. A reading panel will sit over the right middle half. This is a real landscape, never an empty abstract gradient: let the calm left area retain faint lake and distant ridge depth.
Lighting and palette: early golden-hour dawn, refined pale champagne sunlight, clean warm ivory haze, gentle honey highlights on rock, cool steel-blue lake and smoky blue-slate shadows, small natural touches of muted sage green. Balanced warm-cool cinematic light, without any broad orange, red, rust or copper color cast. Cool colors should remain softly desaturated and natural, never neon teal or tropical turquoise. Mountain detail is dimensional and believable, with fine photographic textures and filmic tonal rolloff. The scene should feel luminous, hopeful and spacious, more epic and elegant than a generic forest photo, while staying gentle behind text.
Avoid: no orange-red wash, no oversaturated sunset, no dominant green forest, no fantasy geology, no impossible mirror mountains, no HDR crunch, no oversharpening, no black vignette, no blown white haze, no artificial lens flares, no people, buildings, boats, religious figures, crosses, books, words, logos, watermark, collage, frame or mockup.

## Portrait prompt (exact)

Reference image: desktop original above.

Use case: precise-object-edit / responsive landscape reframing.
Asset type: matching tall portrait photograph for the mobile hero background of a Bible reading website. Input image is the selected panoramic alpine lake scene and lighting reference. Return one clean tall portrait landscape photo alone, ideally 2160 x 3840 with maximum available native detail; no phone or UI.
Primary request: reframe this same majestic dawn mountain lake into a coherent vertical composition, preserving its distinctive monumental granite peaks, delicate snow, pale champagne-gold light on their upper ridges, steel-blue reflective lake, restrained sage-green headlands, soft ivory mist and luminous quiet mood. This should look like a second frame of the exact same location and sunrise, photographed naturally at the same moment.
Composition: put the principal mountain massif in the upper third, slightly right of center, so the sculptural peaks remain visible near the top. Keep sky small, only about the upper 15 to 20 percent. From approximately 25 to 58 percent down, use pale gentle mountain silhouettes and thin soft ivory mist merging into smooth steel-blue lake water, creating a calm readable area for dark verse typography. Avoid high-contrast trees, dark cliff edges, busy rocks or glare through the central middle text region. Let the lake occupy most of the middle and lower frame with very subtle natural ripples and soft reflections. A modest sage-green pine headland with pale stone shore may enter from the lower right, below the text region. The landscape must be recognizable throughout, not an empty sky crop or a blank artificial gradient. The mobile website's reading panel will cover much of the bottom half.
Lighting and color invariants: retain the reference's balanced warm-cool cinematic palette, champagne and honey only as delicate sunlight, clean warm ivory haze, cool blue-slate mountain shadows and desaturated steel-blue/soft teal water with a touch of muted sage. No orange-red or rust color wash, no orange sky covering the scene, no dominant green forest, no tropical neon turquoise. Natural filmic texture, realistic topography and reflections, photographic detail, gentle tonal rolloff.
Avoid: no people, buildings, boats, religious figures, crosses, books, text, logos, watermark, border, collage, phone, mockup, fantasy illustration, crunchy HDR or artificial flare. Preserve the original landscape identity and dawn mood; change only the framing for the tall mobile aspect.

## Visual inspection

Desktop: monumental snowy granite massif near center, warm champagne rim light rather than an orange-red scene-wide wash. Lake water reads as desaturated blue steel with a restrained teal shoreline, dark blue-slate shadows and very small sage-green headlands. Left lake and distant mist form a calm, open text field with faint natural depth. Portrait: same recognizable massif and lake, sky under one fifth, peaks in upper third, soft mist and broad lake throughout middle/lower composition; no busy foreground behind the central verse area. Existing theme-aware CSS veil still controls final readability. No changes to mobile geometry are part of these assets.

## Measured native files

- 1672 × 941 px, 2,141,462 bytes: `/Users/zeus/.codex/generated_images/01a14b6d-b2b0-7aa3-800e-0fde6275a4d1/exec-d1b05d23-6ae8-4ccd-af22-cfe895e65128.png`
- 941 × 1672 px, 2,258,354 bytes: `/Users/zeus/.codex/generated_images/01a14b6d-b2b0-7aa3-800e-0fde6275a4d1/exec-0e91d9b1-82fc-4773-83cb-2e700b11ebb6.png`

Neither native file is 4K. No artificial enlargement was performed.

## Optimized responsive files

Final selected files saved in `public/assets/`; measured metadata is listed below. Sharp encoding: AVIF quality 63, effort 6, 4:4:4; WebP quality 83, effort 6. Native aspect ratio preserved with `withoutEnlargement: true`.

| File | Dimensions (px) | Bytes |
| --- | --- | ---: |
| home-landscape-v6-960.avif | 960 × 540 | 43,443 |
| home-landscape-v6-960.webp | 960 × 540 | 52,864 |
| home-landscape-v6-1280.avif | 1280 × 720 | 68,546 |
| home-landscape-v6-1280.webp | 1280 × 720 | 84,570 |
| home-landscape-v6-1672.avif | 1672 × 941 | 102,654 |
| home-landscape-v6-1672.webp | 1672 × 941 | 126,474 |
| home-landscape-v6-mobile-480.avif | 480 × 853 | 42,142 |
| home-landscape-v6-mobile-480.webp | 480 × 853 | 54,898 |
| home-landscape-v6-mobile-941.avif | 941 × 1672 | 125,036 |
| home-landscape-v6-mobile-941.webp | 941 × 1672 | 164,044 |

Native-size AVIF files were decoded to PNG and visually inspected. Fine snow/rock contours, cloud and mist layers and lake ripples are retained without visible banding in the quiet left text area. Largest desktop AVIF is 102,654 bytes; portrait AVIF is 125,036 bytes, both below the 220 KB target. These v6 AVIF candidates are smaller than v5. Generation and encoding were completed independently before app integration.

## Integración

Los archivos finales están en `public/assets/home-landscape-v6-*` y se mantienen los anteriores para los clientes instalados. La precarga y el picture usan los mismos candidatos; las medidas móviles se conservan y el tema sigue aplicado en CSS. La mayor altura de escritorio se publicó previamente en `bca2b43`.

El encuadre panorámico sitúa la cima por debajo de la barra superior con una posición vertical de 24 px. Esa franja queda oculta bajo la barra, cuyo fondo es sólido para evitar una diferencia de tono al cruzar el inicio de la foto. El encuadre vertical móvil mantiene su posición centrada.

Validación: revisión visual de día y noche entre 320 y 1440 px, sin desbordamientos ni cambios en las alturas aprobadas. Pasaron 16 E2E de cabecera, 12 de lectura rápida y los 10 de estabilidad, textos ampliados y tarjetas. La espera de este último grupo ahora comprueba geometría y fuente estables entre frames, porque las consultas de contenedor pueden terminar de aplicar tipografía después de cargar las fuentes. Se conservaron todas las aserciones y tolerancias. Lint, build, contrato público, corpus y auditoría PWA correctos; se descarga y almacena una sola variante de fondo, disponible también sin conexión.
