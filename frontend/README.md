# Frontend de AgroClima IA

## Inicio rápido

```bash
cp .env.example .env
npm install
npm run dev
```

Completa en `.env` las credenciales públicas de Supabase. El navegador crea una sesión anónima automáticamente; no agregues claves de OpenAI a este archivo.

## Integración de análisis

De forma predeterminada, la aplicación usa las Edge Functions incluidas en `../backend`:

- `analizarRiesgo`, con `{ campoId, ubicacion: { lat, lon } }`.
- `gestionarImagen`, para subir y registrar fotos en el bucket privado.

Si se define `VITE_API_BASE_URL`, se emplea una API REST externa en `POST {VITE_API_BASE_URL}/api/analisis`. Debe aceptar `{ campoId, cultivo, centroide, geojson }` y responder con `{ resultado, analisis }`.

## Verificación

```bash
npm run build
npm test
```
