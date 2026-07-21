# AgroClima IA — Mapa de riesgo climático para cultivos

## La idea

Herramienta donde el productor dibuja el área de su cultivo sobre un mapa, y la IA analiza el clima de esa zona para entregar precauciones concretas según el tipo de cultivo.

**Track:** Riesgos / Agenda 2030
**ODS principal:** 13 — Acción por el clima y gestión de riesgos
**ODS secundario:** 2 — Hambre cero (protección de la producción agrícola)

## Problema

Los pequeños y medianos productores de Manabí no siempre tienen acceso fácil a pronósticos climáticos interpretados para su cultivo específico. Saber que "va a llover" no es lo mismo que saber que ese cultivo de cacao está en riesgo de monilla por exceso de humedad. Esta herramienta traduce el clima crudo en decisiones agronómicas accionables.

## Flujo de la solución

1. Al entrar, el usuario recibe una sesión anónima (Supabase Auth) que identifica sus datos.
2. Dibuja el área de su campo sobre un mapa (Leaflet).
3. Selecciona el cultivo (cacao, café, plátano, maíz, arroz).
4. Puede agregar una o varias fotos del estado actual del cultivo (se suben a Supabase Storage).
5. La app calcula el centroide del área dibujada.
6. Se consulta el pronóstico climático de ese punto.
7. OpenAI analiza clima + cultivo y devuelve: nivel de riesgo, tipo de riesgo y acciones recomendadas.
8. El resultado se muestra en tarjetas y se guarda, junto con las imágenes, asociado al usuario.

## Stack

| Componente | Herramienta |
|---|---|
| Mapa y dibujo de área | Leaflet + Leaflet.Draw |
| Cálculo de centroide | Turf.js |
| Datos climáticos | Open-Meteo (API pública, sin key) |
| Análisis de riesgo | OpenAI API (structured output / JSON schema) |
| Base de datos y autenticación | Supabase (Postgres + Auth anónimo) |
| Almacenamiento de imágenes | Supabase Storage |
| Generación de código asistida | OpenAI Codex |

## Multiusuario y almacenamiento de imágenes

- **Autenticación**: Supabase Auth con inicio de sesión anónimo. Cada usuario recibe un `user_id` de sesión automáticamente al entrar, sin pantalla de login, y ese id queda asociado a sus campos y análisis. Se puede convertir después en cuenta real (email/Google) sin perder datos.
- **Row Level Security (RLS)**: activado en `campos`, `analisis` e `imagenes` para que cada usuario solo pueda ver y modificar sus propios registros (`auth.uid() = user_id`).
- **Imágenes**: los archivos se guardan en Supabase Storage (bucket `cultivo-imagenes`); la base de datos solo guarda la referencia (ruta) a cada imagen, no el binario.

## Esquema de base de datos (Supabase)

**Tabla `campos`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users) — dueño del campo
- `nombre` (text)
- `cultivo` (text)
- `geojson` (text) — área dibujada por el usuario
- `created_at` (timestamp)

**Tabla `analisis`**
- `id` (uuid, PK)
- `campo_id` (uuid, FK → campos.id)
- `clima_json` (jsonb) — pronóstico crudo de Open-Meteo
- `nivel_riesgo` (text) — bajo / medio / alto
- `tipo_riesgo` (text) — ej. exceso de humedad, sequía, viento
- `recomendaciones` (text[]) — acciones sugeridas
- `created_at` (timestamp)

**Tabla `imagenes`**
- `id` (uuid, PK)
- `campo_id` (uuid, FK → campos.id)
- `user_id` (uuid, FK → auth.users)
- `storage_path` (text) — ruta del archivo en el bucket de Storage
- `descripcion` (text, opcional) — nota del usuario sobre la foto
- `created_at` (timestamp)

## Uso de OpenAI

- **API con modelo GPT**: analiza el JSON del pronóstico climático junto con el cultivo seleccionado y devuelve una respuesta estructurada (JSON schema) con nivel de riesgo, tipo de riesgo y recomendaciones.
- **Codex**: generación asistida del frontend (mapa, formulario, tarjetas de resultado) y de la integración con Supabase y Open-Meteo.
- **Supervisión humana**: las recomendaciones se presentan como sugerencias, no como acciones automáticas — el productor decide si aplicarlas. Cada resultado queda trazado en la base de datos con el clima que lo originó, para poder auditar por qué la IA recomendó cada acción.

## Métrica de impacto

Número de campos analizados y porcentaje de análisis que identifican un riesgo medio/alto antes de que ocurra (comparado contra el pronóstico oficial), como proxy de alertas tempranas entregadas al productor.

## Validación del problema

Riesgo climático (sequías, exceso de humedad, eventos derivados de El Niño) es una amenaza reconocida para la producción agrícola de Manabí, especialmente en cultivos como cacao, café y plátano, que son sensibles a la humedad y a variaciones de temperatura.


## Qué demuestra el demo

1. El usuario dibuja un campo real en el mapa.
2. La app trae el clima de esa zona.
3. La IA entrega precauciones específicas para el cultivo elegido.
4. El análisis queda guardado y es consultable después.
