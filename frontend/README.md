# Frontend de AgroClima IA

## Inicio rápido

```bash
cp .env.example .env
npm install
npm run dev
```

Completa en `.env` las credenciales públicas de Supabase. La aplicación requiere una sesión autenticada por enlace de verificación enviado al correo; no agregues claves de OpenAI, Resend, SMTP ni `service_role` a este archivo.

## Acceso por correo de verificación

Antes de probar el inicio de sesión, configura el proyecto `Hakathon` en Supabase:

1. En Resend, verifica `oxitech.dev` y crea una clave SMTP exclusiva para Supabase.
2. En **Authentication → Providers → Email**, activa Email y desactiva Anonymous Sign-Ins.
3. En **Authentication → SMTP Settings**, usa `smtp.resend.com`, puerto `465`, usuario `resend`, la clave de Resend y el remitente `AgroClima IA <no-reply@oxitech.dev>`.
4. En **Authentication → Email Templates**, conserva la plantilla Magic Link con `{{ .ConfirmationURL }}` para enviar el enlace de verificación.
5. Configura las URLs de desarrollo y producción en **Authentication → URL Configuration**; el enlace redirige a `/app` después de verificar al usuario.

Las claves SMTP se guardan únicamente en los ajustes de Supabase. No se incluyen en el repositorio.

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
