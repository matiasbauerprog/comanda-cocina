-- ============================================================================
-- Comanda Gaspacho: clientes con varias direcciones y unión de duplicados
--
-- Correr UNA vez en Supabase > SQL Editor, ANTES de publicar la versión de la
-- app que usa direcciones. Se puede volver a correr sin problema.
--
-- No borra ningún dato. Lo único que borra clientes es la función
-- unir_clientes, y solo cuando el dueño toca "Unir" en /unir-clientes.
-- ============================================================================

-- 1. Respaldo de clientes y pedidos tal cual están hoy. Con RLS activado y sin
--    políticas, así no se pueden leer desde la app.
create table if not exists public.clientes_backup_20261028 as select * from public.clientes;
create table if not exists public.pedidos_backup_20261028  as select * from public.pedidos;
alter table public.clientes_backup_20261028 enable row level security;
alter table public.pedidos_backup_20261028  enable row level security;

-- 2. Lista de direcciones por cliente: [{"etiqueta": "Casa", "direccion": "..."}].
--    La columna vieja "direccion" queda; la app la sigue llenando con la primera.
alter table public.clientes
  add column if not exists direcciones jsonb not null default '[]'::jsonb;

-- 3. Copiar la dirección actual de cada cliente a la lista.
update public.clientes
set direcciones = jsonb_build_array(jsonb_build_object('etiqueta', '', 'direccion', trim(direccion)))
where direcciones = '[]'::jsonb and coalesce(trim(direccion), '') <> '';

-- 4. Unir clientes en una sola transacción: si algo falla no se aplica nada.
--    security invoker = corre con los permisos de quien la llama, así RLS sigue
--    valiendo (solo el dueño puede). Los ids van como texto para servir con
--    uuid o con números.
create or replace function public.unir_clientes(
  p_keep_id text,
  p_nombre text,
  p_direcciones jsonb,
  p_delete_ids text[],
  p_nombres_viejos text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  actualizados integer;
begin
  update clientes
  set nombre = p_nombre,
      direcciones = p_direcciones,
      direccion = coalesce(p_direcciones -> 0 ->> 'direccion', '')
  where id::text = p_keep_id;

  get diagnostics actualizados = row_count;
  if actualizados = 0 then
    raise exception 'No se pudo actualizar el cliente';
  end if;

  update pedidos
  set cliente_nombre = p_nombre
  where lower(trim(cliente_nombre)) in (select lower(trim(x)) from unnest(p_nombres_viejos) as x);

  delete from clientes
  where id::text = any(p_delete_ids) and id::text <> p_keep_id;
end;
$$;

-- 5. Verificación: la cantidad de clientes tiene que coincidir con el respaldo.
select
  (select count(*) from public.clientes)                 as clientes,
  (select count(*) from public.clientes_backup_20261028) as clientes_respaldo,
  (select count(*) from public.clientes where direcciones <> '[]'::jsonb) as con_direcciones;
