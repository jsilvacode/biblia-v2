# Recuperación del episodio de Reavivados · 12/10/2026

El día 12 el calendario de la app apunta a Salmos 66. Nuevo Tiempo publicó “Alabemos al Dios que nos prueba y nos salva”. La función `/api/rpsp` estaba respondiendo `unavailable` sin metadata. Las peticiones a WordPress y al RSS no completaban; el alojamiento VOD aceptó rango `bytes=0-0` (206; `audio/mpeg`; longitud 24 261 593 bytes).

Se añade al snapshot sólo la fecha y referencia verificadas. El endpoint debe devolver `ready`, procedencia `snapshot` y la dirección directa al VOD. Para el 13/10 debe continuar `unavailable` si la fuente sigue inaccesible; no debe reutilizar el audio del 12. La prueba se ejecuta en el handler real `api/rpsp.js` con las dos fuentes lanzando error.

El VOD se reproduce directamente en el navegador; no se descarga ni proxifica. La publicación se comprueba en la URL canónica tras confirmar el SHA nuevo.
