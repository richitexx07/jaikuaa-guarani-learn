-- Pedidos de habilitación para el piloto: un docente pide ser validador o un estudiante del Ateneo
-- pide hacer su práctica de revisión. Un administrador aprueba o rechaza con un toque.
create table if not exists public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  kind text not null check (kind in ('docente', 'practicante')),
  full_name text not null check (char_length(full_name) between 3 and 120),
  institution text not null default '' check (char_length(institution) <= 120),
  note text not null default '' check (char_length(note) <= 300),
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists staff_requests_estado_idx on public.staff_requests (status, created_at desc);
alter table public.staff_requests enable row level security;
-- Sin políticas: se escribe y se lee solo desde el servidor (con permisos de servicio).
