-- Librería Jaikuaa: libros, sus páginas (imagen + voz humana opcional) y quién tiene acceso a cada uno.
-- Los archivos van en el depósito privado «libros»; el servidor entrega enlaces firmados de corta duración
-- solo a quien tiene acceso (o al administrador). Nadie lee estas tablas directo desde el navegador.

create table if not exists public.libros (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 200),
  autor text not null default '' check (char_length(autor) <= 200),
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  portada_path text check (char_length(portada_path) <= 300),
  publicado boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.libro_paginas (
  id uuid primary key default gen_random_uuid(),
  libro_id uuid not null references public.libros(id) on delete cascade,
  n integer not null check (n between 1 and 2000),
  imagen_path text check (char_length(imagen_path) <= 300),
  audio_path text check (char_length(audio_path) <= 300),
  texto text not null default '' check (char_length(texto) <= 20000),
  created_at timestamptz not null default now(),
  unique (libro_id, n)
);

create table if not exists public.libro_accesos (
  id uuid primary key default gen_random_uuid(),
  libro_id uuid not null references public.libros(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  otorgado_por uuid references auth.users(id) on delete set null,
  nota text not null default '' check (char_length(nota) <= 300),
  created_at timestamptz not null default now(),
  unique (libro_id, user_id)
);

create index if not exists libro_accesos_user_idx on public.libro_accesos (user_id);
create index if not exists libro_paginas_libro_idx on public.libro_paginas (libro_id, n);

alter table public.libros enable row level security;
alter table public.libro_paginas enable row level security;
alter table public.libro_accesos enable row level security;

-- Depósito privado para páginas, audios y portadas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('libros', 'libros', false, 15728640,
        array['image/webp','image/jpeg','image/png','audio/mpeg','audio/mp4','audio/webm','audio/ogg','audio/wav','audio/x-m4a'])
on conflict (id) do nothing;
