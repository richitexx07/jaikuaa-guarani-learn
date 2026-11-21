-- Librería → tienda de obras: libros y módulos de especialización (guaraní médico, jurídico, financiero…),
-- con portal propio para autores y docentes.
--  · tipo: 'libro' o 'modulo' (se compran y se leen igual: páginas con imagen, texto y voz humana).
--  · area: rubro del módulo (vacío para los libros).
--  · autor_id: cuenta del autor que puede editar la obra mientras está en borrador u observada.
--  · estado_revision: borrador → en_revision → observado / aprobado (lo decide el administrador).
--  · autorizacion_firmada: el administrador la marca cuando tiene la autorización escrita del autor;
--    sin ella la obra no se puede publicar (lo controla el servidor).
--  · porcentaje_autor: parte del autor acordada por contrato (solo la ven el administrador y el autor).
--  · precio_propuesto_gs: precio que sugiere el autor; el precio de venta (precio_gs) lo fija el administrador.
-- Todo se lee y escribe desde el servidor (RLS sin políticas, igual que el resto de la Librería).

alter table public.libros
  add column if not exists tipo text not null default 'libro',
  add column if not exists area text,
  add column if not exists autor_id uuid references auth.users(id) on delete set null,
  add column if not exists estado_revision text not null default 'borrador',
  add column if not exists autorizacion_firmada boolean not null default false,
  add column if not exists porcentaje_autor integer,
  add column if not exists precio_propuesto_gs integer,
  add column if not exists nota_revision text not null default '';

do $$ begin
  alter table public.libros add constraint libros_tipo_chk check (tipo in ('libro', 'modulo'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_area_chk check (area is null or area in ('medico', 'juridico', 'financiero', 'educacion', 'turismo', 'otro'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_estado_chk check (estado_revision in ('borrador', 'en_revision', 'observado', 'aprobado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_porcentaje_chk check (porcentaje_autor is null or porcentaje_autor between 0 and 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_precio_propuesto_chk check (precio_propuesto_gs is null or precio_propuesto_gs between 1000 and 10000000);
exception when duplicate_object then null; end $$;

create index if not exists libros_autor_idx on public.libros (autor_id);

-- Autores y docentes habilitados para cargar obras (los habilita el administrador).
create table if not exists public.autores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  habilitado boolean not null default true,
  habilitado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.autores enable row level security;

create index if not exists pagos_ref_estado_idx on public.pagos (ref_id, estado);

-- Los pagos ahora pueden ser de un libro o de un módulo.
alter table public.pagos drop constraint if exists pagos_tipo_check;
alter table public.pagos add constraint pagos_tipo_check check (tipo in ('libro', 'modulo'));
