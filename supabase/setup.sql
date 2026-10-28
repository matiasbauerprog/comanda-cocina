-- ============================================================================
-- Comanda Gaspacho: autenticación y permisos (Row Level Security)
--
-- Correr en Supabase > SQL Editor DESPUÉS de crear los dos usuarios en
-- Authentication > Users > Add user (marcar "Auto Confirm User"):
--   - el del dueño   (mismo email que VITE_OWNER_EMAIL)
--   - el de cocina   (mismo email que VITE_KITCHEN_EMAIL)
--
-- Reemplazá los dos emails del paso 4 antes de correrlo.
-- ============================================================================

-- 1. Rol del usuario logueado, tomado del token (app_metadata solo lo puede
--    modificar un admin, no el propio usuario).
create or replace function public.app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

-- 2. Borrar las políticas actuales de las tres tablas. Son las que hoy dejan
--    leer y escribir a cualquiera que tenga la anon key.
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('pedidos', 'platos', 'clientes')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- 3. Activar RLS y crear las políticas nuevas.
--    Sin política para "anon" = sin sesión no se puede leer ni escribir nada.
alter table public.pedidos  enable row level security;
alter table public.platos   enable row level security;
alter table public.clientes enable row level security;

-- Dueño: acceso total
create policy "owner_all_pedidos" on public.pedidos
  for all to authenticated
  using (public.app_role() = 'owner') with check (public.app_role() = 'owner');

create policy "owner_all_platos" on public.platos
  for all to authenticated
  using (public.app_role() = 'owner') with check (public.app_role() = 'owner');

create policy "owner_all_clientes" on public.clientes
  for all to authenticated
  using (public.app_role() = 'owner') with check (public.app_role() = 'owner');

-- Cocina: solo ver los pedidos
create policy "kitchen_read_pedidos" on public.pedidos
  for select to authenticated
  using (public.app_role() = 'kitchen');

-- 4. Asignar el rol a cada usuario. CAMBIAR LOS EMAILS.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "owner"}'
where email = 'dueno@ejemplo.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "kitchen"}'
where email = 'cocina@ejemplo.com';

-- 5. Verificación: tiene que mostrar los dos usuarios con su rol.
select email, raw_app_meta_data ->> 'role' as role
from auth.users
where raw_app_meta_data ->> 'role' in ('owner', 'kitchen');
