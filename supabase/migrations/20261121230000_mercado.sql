-- Mercado Jaikuaa: el mercado de todo el ecosistema (libros y módulos de la Librería, artesanía de Tembiapo,
-- música y artistas de Purahéi, clases y traducciones, experiencias y propuestas para empresas).
--  · Las obras de la Librería siguen en «libros»; todo lo demás vive en «mercado_productos».
--  · Un carrito con varios productos se paga una sola vez: «mercado_ordenes» guarda el pedido de Pagopar y
--    cada producto es una fila en «pagos» (así el reparto con vendedores, autores y embajadores sigue igual).
--  · Opiniones solo de quien compró; favoritos; postulaciones de vendedores; cupones de descuento.
--  · Lo que hay que entregar a mano (físico, servicio, experiencia) queda en «pedidos_fisicos» con su tipo de entrega.
-- Todo se lee y escribe desde el servidor (RLS sin políticas).

create table if not exists public.mercado_productos (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references auth.users(id) on delete set null,
  vendedor_nombre text not null default '' check (char_length(vendedor_nombre) <= 120),
  categoria text not null check (categoria in ('artesania', 'musica', 'clases', 'traducciones', 'experiencias', 'empresas', 'otros')),
  entrega text not null check (entrega in ('fisico', 'digital', 'servicio', 'experiencia', 'cotizacion')),
  titulo text not null check (char_length(titulo) between 1 and 160),
  descripcion text not null default '' check (char_length(descripcion) <= 4000),
  -- Hasta 8 fotos públicas (depósito «mercado») y, para lo digital, el archivo privado (depósito «mercado-archivos»).
  fotos jsonb not null default '[]'::jsonb check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 8),
  archivo_path text,
  precio_gs integer check (precio_gs is null or precio_gs between 1000 and 100000000),
  precio_anterior_gs integer check (precio_anterior_gs is null or precio_anterior_gs between 1000 and 100000000),
  stock integer check (stock is null or stock >= 0),
  ciudad text not null default '' check (char_length(ciudad) <= 80),
  lugar text not null default '' check (char_length(lugar) <= 200),
  fecha_evento timestamptz,
  duracion text not null default '' check (char_length(duracion) <= 80),
  envio text not null default '' check (char_length(envio) <= 300),
  ref_pieza uuid references public.tembiapo_piezas(id) on delete set null,
  ref_artista uuid references public.purahei_artistas(id) on delete set null,
  estado_revision text not null default 'borrador' check (estado_revision in ('borrador', 'en_revision', 'observado', 'aprobado')),
  nota_revision text not null default '' check (char_length(nota_revision) <= 2000),
  autorizacion_firmada boolean not null default false,
  porcentaje_vendedor integer check (porcentaje_vendedor is null or porcentaje_vendedor between 0 and 100),
  publicado boolean not null default false,
  destacado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mercado_producto_publicable check (not publicado or (autorizacion_firmada and jsonb_array_length(fotos) >= 1)),
  constraint mercado_producto_precio check (entrega = 'cotizacion' or precio_gs is not null or not publicado)
);
alter table public.mercado_productos enable row level security;
create index if not exists mercado_productos_pub_idx on public.mercado_productos (publicado, categoria, created_at desc);
create index if not exists mercado_productos_vendedor_idx on public.mercado_productos (vendedor_id);

create table if not exists public.mercado_ordenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_gs integer not null check (total_gs >= 1000),
  descuento_gs integer not null default 0 check (descuento_gs >= 0),
  cupon text,
  hash_pedido text unique,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'cancelado')),
  modo text not null default 'pagopar' check (modo in ('pagopar', 'prueba')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mercado_ordenes enable row level security;
create index if not exists mercado_ordenes_user_idx on public.mercado_ordenes (user_id, created_at desc);

alter table public.pagos
  add column if not exists orden_id uuid references public.mercado_ordenes(id) on delete set null,
  add column if not exists item_tipo text not null default 'obra',
  add column if not exists cantidad integer not null default 1;
alter table public.pagos drop constraint if exists pagos_tipo_check;
alter table public.pagos add constraint pagos_tipo_check check (tipo in ('libro', 'modulo', 'curso', 'producto'));
do $$ begin
  alter table public.pagos add constraint pagos_item_tipo_chk check (item_tipo in ('obra', 'producto'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.pagos add constraint pagos_cantidad_chk check (cantidad between 1 and 50);
exception when duplicate_object then null; end $$;
create index if not exists pagos_orden_idx on public.pagos (orden_id) where orden_id is not null;

-- Entregas a mano: ahora también servicios y experiencias (sin dirección).
alter table public.pedidos_fisicos
  add column if not exists producto_id uuid references public.mercado_productos(id) on delete set null,
  add column if not exists vendedor_id uuid references auth.users(id) on delete set null,
  add column if not exists entrega text not null default 'fisico',
  add column if not exists cantidad integer not null default 1;
alter table public.pedidos_fisicos drop constraint if exists pedidos_fisicos_ciudad_check;
alter table public.pedidos_fisicos drop constraint if exists pedidos_fisicos_direccion_check;
alter table public.pedidos_fisicos add constraint pedidos_fisicos_ciudad_check check (char_length(ciudad) <= 80);
alter table public.pedidos_fisicos add constraint pedidos_fisicos_direccion_check check (char_length(direccion) <= 200);
do $$ begin
  alter table public.pedidos_fisicos add constraint pedidos_fisicos_entrega_chk check (entrega in ('fisico', 'servicio', 'experiencia'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.pedidos_fisicos add constraint pedidos_fisicos_dir_fisico_chk check (entrega <> 'fisico' or (char_length(direccion) >= 4 and char_length(ciudad) >= 2));
exception when duplicate_object then null; end $$;
create index if not exists pedidos_fisicos_vendedor_idx on public.pedidos_fisicos (vendedor_id) where vendedor_id is not null;

create table if not exists public.mercado_resenas (
  id uuid primary key default gen_random_uuid(),
  item_tipo text not null check (item_tipo in ('obra', 'producto')),
  item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  estrellas integer not null check (estrellas between 1 and 5),
  texto text not null default '' check (char_length(texto) <= 1000),
  oculta boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_tipo, item_id, user_id)
);
alter table public.mercado_resenas enable row level security;
create index if not exists mercado_resenas_item_idx on public.mercado_resenas (item_tipo, item_id);

create table if not exists public.mercado_favoritos (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_tipo text not null check (item_tipo in ('obra', 'producto')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_tipo, item_id)
);
alter table public.mercado_favoritos enable row level security;

create table if not exists public.mercado_postulaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 120),
  categoria text not null check (categoria in ('libreria', 'artesania', 'musica', 'clases', 'traducciones', 'experiencias', 'empresas', 'otros')),
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  whatsapp text not null check (char_length(whatsapp) between 6 and 30),
  ciudad text not null default '' check (char_length(ciudad) <= 80),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota text not null default '' check (char_length(nota) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mercado_postulaciones enable row level security;
create index if not exists mercado_postulaciones_estado_idx on public.mercado_postulaciones (estado, created_at desc);

create table if not exists public.mercado_cupones (
  codigo text primary key check (codigo ~ '^[A-Z0-9]{3,20}$'),
  porcentaje integer not null check (porcentaje between 1 and 90),
  vence date,
  usos_max integer check (usos_max is null or usos_max > 0),
  usos integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.mercado_cupones enable row level security;

alter table public.autores
  add column if not exists whatsapp text not null default '',
  add column if not exists ciudad text not null default '';

-- Fotos de productos: públicas (se ven en el catálogo). Archivos digitales a la venta: privados.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mercado', 'mercado', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mercado-archivos', 'mercado-archivos', false, 52428800, array['application/pdf', 'application/zip', 'audio/mpeg', 'audio/mp4', 'image/png', 'image/jpeg', 'application/epub+zip'])
on conflict (id) do nothing;
