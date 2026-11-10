alter table public.libros add column if not exists precio_gs integer check (precio_gs is null or (precio_gs >= 1000 and precio_gs <= 10000000));

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tipo text not null default 'libro' check (tipo in ('libro')),
  ref_id uuid not null,
  descripcion text not null default '' check (char_length(descripcion) <= 300),
  monto_gs integer not null check (monto_gs >= 1000),
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado','cancelado')),
  modo text not null default 'pagopar' check (modo in ('pagopar','prueba')),
  hash_pedido text unique,
  pagado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pagos_user_idx on public.pagos (user_id, created_at desc);

grant all on public.pagos to service_role;
alter table public.pagos enable row level security;
-- Sin políticas: solo el servidor lee y escribe pagos.