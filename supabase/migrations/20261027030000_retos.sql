-- Retos con amigos: una partida (misma semilla) que juegan varias personas, cada una cuando
-- quiere. Se guarda el primer puntaje de cada persona para armar la tabla del reto.

create table if not exists public.retos (
  id text primary key check (id ~ '^[A-Za-z0-9]{6,12}$'),
  juego text not null check (juego in ('penales', 'ahorcado', 'memoria', 'sopa', 'tembiu', 'taanga', 'tekojoja', 'karaoke', 'trivia', 'consultorio')),
  semilla bigint not null check (semilla >= 0),
  extra text check (char_length(extra) <= 40),
  total integer not null default 0 check (total between 0 and 100000),
  unidad text check (char_length(unidad) <= 14),
  menos_es_mejor boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  creado_por_nombre text,
  created_at timestamptz not null default now()
);

create table if not exists public.reto_resultados (
  reto_id text not null references public.retos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text,
  puntaje integer not null check (puntaje between 0 and 100000),
  created_at timestamptz not null default now(),
  primary key (reto_id, user_id)
);

create index if not exists reto_resultados_reto_idx on public.reto_resultados (reto_id);

-- Todo se lee y escribe desde el servidor (que verifica la sesión); nadie accede directo.
alter table public.retos enable row level security;
alter table public.reto_resultados enable row level security;
