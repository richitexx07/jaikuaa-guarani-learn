-- Librería: tienda completa.
--  · Ficha de la obra: público objetivo, variante de lengua, precio para instituciones (por persona),
--    edición impresa (precio aparte, envío manual) y preventa (se compra antes de que esté disponible).
--  · Cursos: el tipo «curso» y video por página (id de un video de YouTube no listado; solo lo ve quien compró).
--  · Vitrina pública de cada autor: slug, presentación y foto.
--  · Pedidos impresos: dirección de envío y estado (esperando pago → por enviar → enviado → entregado).
--  · Reparto: comisión fija para embajadores (afiliados) y registro de lo que ya se les pagó a autores y afiliados.
--    El dinero no lo mueve el sistema: solo se registra lo que el administrador pagó.
-- Todo se lee y escribe desde el servidor (RLS sin políticas, como el resto de la Librería).

alter table public.libros
  add column if not exists publico text not null default '',
  add column if not exists variante text,
  add column if not exists precio_institucional_gs integer,
  add column if not exists precio_fisico_gs integer,
  add column if not exists en_preventa boolean not null default false,
  add column if not exists fecha_disponible date;

alter table public.libros drop constraint if exists libros_tipo_chk;
alter table public.libros add constraint libros_tipo_chk check (tipo in ('libro', 'modulo', 'curso'));
do $$ begin
  alter table public.libros add constraint libros_variante_chk check (variante is null or variante in ('guarani', 'jopara', 'bilingue', 'castellano'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_publico_chk check (char_length(publico) <= 300);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_precio_inst_chk check (precio_institucional_gs is null or precio_institucional_gs between 1000 and 10000000);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.libros add constraint libros_precio_fisico_chk check (precio_fisico_gs is null or precio_fisico_gs between 1000 and 10000000);
exception when duplicate_object then null; end $$;

alter table public.libro_paginas add column if not exists video_id text;
do $$ begin
  alter table public.libro_paginas add constraint libro_paginas_video_chk check (video_id is null or video_id ~ '^[A-Za-z0-9_-]{11}$');
exception when duplicate_object then null; end $$;

alter table public.autores
  add column if not exists slug text,
  add column if not exists bio text not null default '',
  add column if not exists foto_path text,
  add column if not exists vitrina boolean not null default true;
create unique index if not exists autores_slug_key on public.autores (slug) where slug is not null;
do $$ begin
  alter table public.autores add constraint autores_slug_chk check (slug is null or (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.autores add constraint autores_bio_chk check (char_length(bio) <= 1500);
exception when duplicate_object then null; end $$;

alter table public.pagos
  add column if not exists formato text not null default 'digital',
  add column if not exists afiliado_id uuid references auth.users(id) on delete set null,
  add column if not exists porcentaje_afiliado integer;
alter table public.pagos drop constraint if exists pagos_tipo_check;
alter table public.pagos add constraint pagos_tipo_check check (tipo in ('libro', 'modulo', 'curso'));
do $$ begin
  alter table public.pagos add constraint pagos_formato_chk check (formato in ('digital', 'fisico'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.pagos add constraint pagos_pct_afiliado_chk check (porcentaje_afiliado is null or porcentaje_afiliado between 0 and 50);
exception when duplicate_object then null; end $$;
create index if not exists pagos_afiliado_idx on public.pagos (afiliado_id) where afiliado_id is not null;

create table if not exists public.pedidos_fisicos (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null unique references public.pagos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  libro_id uuid references public.libros(id) on delete set null,
  titulo text not null,
  nombre text not null check (char_length(nombre) between 2 and 120),
  telefono text not null check (char_length(telefono) between 6 and 30),
  ciudad text not null check (char_length(ciudad) between 2 and 80),
  direccion text not null check (char_length(direccion) between 4 and 200),
  referencia text not null default '' check (char_length(referencia) <= 200),
  estado text not null default 'esperando_pago' check (estado in ('esperando_pago', 'por_enviar', 'enviado', 'entregado', 'cancelado')),
  nota text not null default '' check (char_length(nota) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pedidos_fisicos enable row level security;
create index if not exists pedidos_fisicos_estado_idx on public.pedidos_fisicos (estado, created_at desc);
create index if not exists pedidos_fisicos_user_idx on public.pedidos_fisicos (user_id);

create table if not exists public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  beneficiario_id uuid not null references auth.users(id) on delete cascade,
  rol text not null check (rol in ('autor', 'afiliado')),
  monto_gs integer not null check (monto_gs > 0 and monto_gs <= 1000000000),
  nota text not null default '' check (char_length(nota) <= 300),
  pagado_el date not null default current_date,
  registrado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.liquidaciones enable row level security;
create index if not exists liquidaciones_benef_idx on public.liquidaciones (beneficiario_id, rol);

create table if not exists public.libreria_ajustes (
  id integer primary key default 1 check (id = 1),
  porcentaje_afiliado integer not null default 10 check (porcentaje_afiliado between 0 and 50),
  updated_at timestamptz not null default now()
);
alter table public.libreria_ajustes enable row level security;
insert into public.libreria_ajustes (id) values (1) on conflict (id) do nothing;
