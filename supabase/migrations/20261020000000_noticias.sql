-- Ñande Marandu: noticias del guaraní con aprobación humana.
-- Una tarea programada carga cada mañana hasta 3 noticias verificadas como «pendiente».
-- Solo un administrador las publica o descarta. Nada sale al público sin esa aprobación.
-- Cada noticia guarda su fuente y el enlace a la nota original: solo título y resumen propio,
-- nunca el texto de la nota.

create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 5 and 140),
  resumen text not null check (char_length(resumen) between 20 and 400),
  categoria text not null default 'Cultura' check (categoria in ('Cultura', 'Educación', 'Comunidad')),
  emoji text not null default '📰' check (char_length(emoji) <= 8),
  fuente text not null check (char_length(fuente) between 2 and 80),
  url text not null unique check (url ~ '^https://'),
  fecha_nota date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'descartada')),
  cargada_por text not null default 'tarea-diaria' check (char_length(cargada_por) <= 40),
  created_at timestamptz not null default now(),
  revisada_por uuid references auth.users(id),
  revisada_at timestamptz
);
create index if not exists noticias_estado_fecha_idx on public.noticias (estado, fecha_nota desc);

alter table public.noticias enable row level security;

-- Lectura pública solo de las publicadas.
create policy "noticias_select_publicadas" on public.noticias
  for select to anon, authenticated
  using (estado = 'publicada');

-- Los administradores ven todas (pendientes y descartadas incluidas).
create policy "noticias_select_admin" on public.noticias
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- Escritura: solo desde el servidor (service role), después de verificar que es administrador.
