# Recuperación del episodio de Reavivados · 12/10/2026

El día 12 el calendario de la app apunta a Salmos 66. Nuevo Tiempo publicó “Alabemos al Dios que nos prueba y nos salva”. La función `/api/rpsp` estaba respondiendo `unavailable` sin metadata. Las peticiones a WordPress y al RSS no completaban; el alojamiento VOD aceptó rango `bytes=0-0` (206; `audio/mpeg`; longitud 24 261 593 bytes).

Se añade al snapshot sólo la fecha y referencia verificadas. El endpoint debe devolver `ready`, procedencia `snapshot` y la dirección directa al VOD. Para el 13/10 debe continuar `unavailable` si la fuente sigue inaccesible; no debe reutilizar el audio del 12. La prueba se ejecuta en el handler real `api/rpsp.js` con las dos fuentes lanzando error.

El commit `054b47e` está publicado en `origin/main`. En `https://www.santabiblia.cloud/reavivados`, la producción muestra el episodio y el reproductor carga `https://vod.nuevotiempo.org/ReavivadosA/Reavivados12-10-2026.mp3`; el navegador confirmó `readyState: 4`, ausencia de error y avance de posición mientras reproducía. Se dejó pausado tras la comprobación. El VOD se reproduce directamente en el navegador; no se descarga ni proxifica.
