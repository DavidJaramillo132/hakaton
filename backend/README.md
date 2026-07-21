# Backend de AgroClima IA

El backend usa Supabase Auth anónimo, Postgres, Storage y dos Edge Functions.

- `analizarRiesgo` recibe `campoId` y el centroide `{ lat, lon }`, consulta Open-Meteo, solicita el análisis estructurado a OpenAI y guarda el resultado.
- `gestionarImagen` recibe una imagen base64 de hasta 5 MB, la guarda en el bucket privado y registra el metadato.

## Secretos

Configura estos secretos para `analizarRiesgo`:

```text
OPENAI_API_KEY=<clave-de-servidor-de-openai>
OPENAI_MODEL=<modelo-compatible-con-Responses-y-JSON-schema>
```

Supabase proporciona `SUPABASE_URL` y `SUPABASE_ANON_KEY` a las Edge Functions. Ninguna función usa ni expone una clave de servicio.

## Integración del cliente

1. Crea la sesión con `supabase.auth.signInAnonymously()` cuando no haya una activa.
2. Al guardar un campo, usa el id de la sesión en `user_id`.
3. Calcula el centroide con Turf y llama `supabase.functions.invoke("analizarRiesgo", { body: { campoId, ubicacion: { lat, lon } } })`.
4. Para fotos, invoca `gestionarImagen` con `action: "upload"`, `campoId`, `fileName`, `contentType`, `base64` y, opcionalmente, `descripcion`.

## Despliegue

La migración y las funciones se despliegan con JWT verificado. Antes de usar el cliente, habilita **Anonymous Sign-Ins** en `Authentication > Sign In / Providers` del proyecto y registra los secretos `OPENAI_API_KEY` y `OPENAI_MODEL` en Edge Functions. La migración crea el bucket privado `cultivo-imagenes` y habilita RLS para que cada sesión vea únicamente sus datos.

Una vez habilitado Auth anónimo, verifica el flujo creando dos sesiones con `signInAnonymously()`: cada una debe ver solo sus campos, análisis e imágenes.
