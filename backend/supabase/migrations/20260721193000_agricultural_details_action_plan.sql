begin;

alter table public.campos
  add column if not exists fecha_siembra date,
  add column if not exists edad_cultivo_meses integer,
  add column if not exists sistema_riego text,
  add column if not exists tipo_suelo text,
  add column if not exists ultima_aplicacion_fertilizante date,
  add column if not exists variedad_cultivo text;

alter table public.campos
  add constraint campos_edad_cultivo_meses_check check (edad_cultivo_meses is null or edad_cultivo_meses between 0 and 1200),
  add constraint campos_sistema_riego_check check (sistema_riego is null or sistema_riego = any (array['ninguno','goteo','aspersión','gravedad','otro']::text[])),
  add constraint campos_tipo_suelo_check check (tipo_suelo is null or tipo_suelo = any (array['arcilloso','arenoso','franco','limoso','otro']::text[]));

alter table public.analisis add column if not exists plan_7_dias jsonb;

grant select, insert, update, delete on public.campos to authenticated;
grant select, insert, delete on public.analisis to authenticated;

commit;
