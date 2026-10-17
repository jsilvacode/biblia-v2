# Golden-hour hero generation · 2026-10-17

Tool: built-in `image_gen` (no CLI/API fallback). Both outputs viewed and inspected. No UI or text baked in. Nature-only photographs with warm amber/champagne light, sparse desaturated conifers, river and layers of mist. Final browser theme overlays remain CSS-owned.

## Selected originals

- Desktop: `/Users/zeus/.codex/generated_images/01a14b6d-b2b0-7aa3-800e-0fde6275a4d1/exec-451c0acd-667f-4828-923c-4f51d716d6e4.png`
- Portrait: `/Users/zeus/.codex/generated_images/01a14b6d-b2b0-7aa3-800e-0fde6275a4d1/exec-a9a0f76c-6b13-4192-8bdc-f2fe3f606195.png`

The built-in tool was asked for maximum native resolution, ideally UHD; actual dimensions must be reported honestly, without calling these files 4K or upscaling to claim added detail.

## Desktop prompt (exact)

Use case: photorealistic-natural.
Asset type: original premium photographic background asset for the hero of Santa Biblia, a Bible reading website. Output the landscape photograph alone, never a UI mockup. Maximum native resolution available, ideally 3840 x 2160, wide 16:9.
Primary request: an awe-inspiring, epic yet peaceful alpine valley at golden hour, with monumental rugged stone and lightly snow-dusted mountain peaks, receding ridges, a luminous river far below, layers of drifting valley mist, and a restrained scattering of dark conifers. Make it feel like a finely photographed cinematic sunrise, with natural believable geology and exquisite photographic detail, not fantasy concept art.
Composition: a wide panoramic establishing shot from a high valley overlook. The left 42 percent must be exceptionally calm and low contrast: softly illuminated champagne-colored mist with barely visible distant mountain silhouettes, enough real landscape to have depth, but no busy dark trees, rocks, bright sun disk, or high contrast edges behind website text. Put the strongest sculptural mountain ridge in the upper center-right, with warm rim light. Keep the highest peak around 58 percent across and 25 percent down so it survives a wide hero crop. The far right and lower right can carry a few crisp dramatic stone slopes and sparse trees, because a reading panel will sit in front of them. Top 20 percent sky only, with delicately layered clouds. Lower half shows layered valley, river reflections, warm copper-gold terrain and atmospheric depth rather than a solid green forest.
Lighting and palette: spectacular but tasteful golden dawn light from the upper right, luminous amber and honey sun rays gently grazing stone ridges, champagne haze, warm ivory clouds, copper and muted bronze grasses, smoky slate shadows. Cinematic light scattering through real mist, a fine subtle luminous smoke-like gradient toward the left. Green is scarce and desaturated; avoid an overall green cast. Preserve stone texture and depth without crunchy HDR, oversharpening, artificial halos, oversaturated orange, excessive white fog, or blown highlights. Natural filmic tonal rolloff, serene hopeful atmosphere, restrained editorial color grading.
Constraints: this is a clean natural landscape image, no words, no letters, no logos, no watermark, no humans, no buildings, no religious figures, no crosses, no books, no collage, no black frame. Retain believable daylight photographic realism and a broad calm bright area on the left for readable dark typography.

## Portrait prompt (exact)

Reference image: desktop original above.

Use case: precise-object-edit / responsive landscape reframing.
Asset type: matching tall portrait photographic background for the mobile hero of the Santa Biblia Bible website. Use the supplied image as the selected landscape and lighting reference. Output only a single tall landscape photo, no phone, no UI. Maximum native detail available, ideally 2160 x 3840 or a tall 9:19.5 portrait.
Primary request: reframe this exact golden-hour mountain valley into a coherent vertical composition with its same monumental stone mountains, fine snowy ridges, glowing winding river and natural copper-gold dawn. Preserve the real photographic detail, champagne mist, warm honey and amber rim light, smoky slate shadows, very desaturated sparse conifers, and the same serene but epic cinematic character.
Composition for this tall mobile asset: a clearly recognizable mountain ridge and softly glowing golden sky occupy only the upper quarter. Across the full width from 25 to 57 percent down, create a calm softly luminous valley atmosphere with subtle distant layered silhouettes and gentle warm mist; this is where dark Bible verse typography will be placed, so avoid strong black cliff edges, foreground trees, bright sun disks or noisy cloud detail in this middle area. From 55 percent down, reveal the winding river valley and more detailed copper-bronze terrain, with a small rugged stone overlook and sparse trees near the lower right, arranged naturally. A reading panel will cover much of the lower half. Let the landscape remain recognizable throughout the tall image rather than leaving a vast empty sky. The main sharp mountain ridge may be nearer the upper right, surrounded by luminous atmospheric depth.
Lighting: exquisite golden dawn light from the upper right, softly scattered through mist, natural filmic highlight rolloff, no blown white fog. Strong visual warmth without oversaturated orange and without green forest dominating the frame. Retain deep photographic dimensionality and natural geology. No hard painted overlay or arbitrary vignette.
Invariants and avoid: preserve the reference landscape's palette, mountain and river identity and sunrise mood; change only framing and arrange atmospheric space for a tall mobile composition. No text, logos, watermark, books, people, buildings, religious figures, crosses, UI, border, collage, fantasy illustration, crunchy HDR or oversharpening.

## Visual inspection

Desktop: upper-right warm sunrise, sculptural main ridge center-right, softly luminous layered left valley supports dark text, subdued green, natural photographic detail. Main ridge survives the existing wide hero crop; left has calm mist. Portrait: coherent matching river valley and same ridge, not an empty sky crop; centered upper-to-middle light haze preserves a readable verse area while mountains stay legible. Existing mobile CSS veil still needed for text over the ridge. Output is the asset alone, no layout changes. The responsive files were integrated after the library and recent-reading releases were publicly verified.

## Measured native files

- Desktop: 1672 × 941 px, 2,333,889 bytes (PNG).
- Portrait: 941 × 1672 px, 2,348,099 bytes (PNG).
- Neither file is 4K. No upscaling was performed.

## Optimized responsive files

Final files saved in `public/assets/`. Sharp encoding: AVIF quality 63, effort 6, 4:4:4; WebP quality 83, effort 6. Native aspect ratio preserved, without upscaling. The measured file metadata is listed below.

| File | Dimensions (px) | Bytes |
| --- | --- | ---: |
| home-landscape-v5-960.avif | 960 × 540 | 63,812 |
| home-landscape-v5-960.webp | 960 × 540 | 79,826 |
| home-landscape-v5-1280.avif | 1280 × 720 | 97,270 |
| home-landscape-v5-1280.webp | 1280 × 720 | 124,668 |
| home-landscape-v5-1672.avif | 1672 × 941 | 141,190 |
| home-landscape-v5-1672.webp | 1672 × 941 | 180,984 |
| home-landscape-v5-mobile-480.avif | 480 × 853 | 57,444 |
| home-landscape-v5-mobile-480.webp | 480 × 853 | 72,652 |
| home-landscape-v5-mobile-941.avif | 941 × 1672 | 153,746 |
| home-landscape-v5-mobile-941.webp | 941 × 1672 | 194,452 |

Both native-size AVIF outputs were decoded back to PNG and visually inspected. Fine ridge, cloud and mist detail is retained with no visible banding in the calm text area. Desktop AVIF 141,190 bytes and portrait AVIF 153,746 bytes are below the requested 220/230 KB budgets. Both WebP masters remain under 200 KB, below the 330 KB budget. Generation and encoding were completed before integrating the image into app source.

## Integración en el proyecto

Imágenes finales guardadas en `public/assets/home-landscape-v5-*` (AVIF y WebP; nombres y tamaños en la tabla anterior). Se conserva el tamaño nativo, sin ampliarlo artificialmente. El `picture` y la precarga usan los mismos candidatos; las versiones anteriores permanecen disponibles para clientes que todavía las usan.

El velo claro se reduce fuera del texto para recuperar detalle del valle y luz cálida; se conserva el apoyo de niebla detrás de la promesa y el tratamiento nocturno. Las dimensiones y márgenes del hero permanecen iguales.

Validación: 38 E2E de fotografía única, apertura, texto y búsqueda rápida aprobados; revisión en 320/390/768/1440 px, día/noche; lint/build/contrato/corpus correctos. Auditoría de PWA confirma una sola fotografía en caché, fondo disponible offline y capítulos descargados legibles sin red.
