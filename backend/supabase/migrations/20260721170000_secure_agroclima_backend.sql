-- AgroClima IA: seguridad y persistencia.
begin;

alter table public.campos enable row level security;
alter table public.analisis enable row level security;
alter table public.imagenes enable row level security;

-- Explicit Data API grants; RLS below controls visible rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.campos to authenticated;
grant select, insert, delete on public.analisis to authenticated;
grant select, insert, delete on public.imagenes to authenticated;

-- Cover ownership checks and the history/photo retrieval paths.
create index if not exists campos_user_id_idx on public.campos (user_id);
create index if not exists analisis_campo_id_created_at_idx on public.analisis (campo_id, created_at desc);
create index if not exists imagenes_user_id_idx on public.imagenes (user_id);
create index if not exists imagenes_campo_id_created_at_idx on public.imagenes (campo_id, created_at desc);

drop policy if exists "campos_select_own" on public.campos;
create policy "campos_select_own" on public.campos for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "campos_insert_own" on public.campos;
create policy "campos_insert_own" on public.campos for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "campos_update_own" on public.campos;
create policy "campos_update_own" on public.campos for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "campos_delete_own" on public.campos;
create policy "campos_delete_own" on public.campos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Analyses inherit ownership from their field and remain immutable for audit.
drop policy if exists "analisis_select_own_field" on public.analisis;
create policy "analisis_select_own_field" on public.analisis for select to authenticated
  using (exists (select 1 from public.campos c where c.id = analisis.campo_id and c.user_id = (select auth.uid())));
drop policy if exists "analisis_insert_own_field" on public.analisis;
create policy "analisis_insert_own_field" on public.analisis for insert to authenticated
  with check (exists (select 1 from public.campos c where c.id = analisis.campo_id and c.user_id = (select auth.uid())));
drop policy if exists "analisis_delete_own_field" on public.analisis;
create policy "analisis_delete_own_field" on public.analisis for delete to authenticated
  using (exists (select 1 from public.campos c where c.id = analisis.campo_id and c.user_id = (select auth.uid())));

drop policy if exists "imagenes_select_own" on public.imagenes;
create policy "imagenes_select_own" on public.imagenes for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "imagenes_insert_own_field" on public.imagenes;
create policy "imagenes_insert_own_field" on public.imagenes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.campos c where c.id = imagenes.campo_id and c.user_id = (select auth.uid())));
drop policy if exists "imagenes_delete_own" on public.imagenes;
create policy "imagenes_delete_own" on public.imagenes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Private storage objects are always placed under <user_id>/<campo_id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cultivo-imagenes', 'cultivo-imagenes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cultivo_images_select_own_folder" on storage.objects;
create policy "cultivo_images_select_own_folder" on storage.objects for select to authenticated
  using (bucket_id = 'cultivo-imagenes' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "cultivo_images_insert_own_folder" on storage.objects;
create policy "cultivo_images_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'cultivo-imagenes' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "cultivo_images_delete_own_folder" on storage.objects;
create policy "cultivo_images_delete_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'cultivo-imagenes' and (storage.foldername(name))[1] = (select auth.uid()::text));

commit;
