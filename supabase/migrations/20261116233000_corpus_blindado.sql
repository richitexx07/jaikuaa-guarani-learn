-- Cuidar el corpus de Jaikuaa (palabras revisadas por docentes y voces reales).
-- 1) Nadie puede leer las palabras directo de la base desde afuera (con la llave pública de la página):
--    todo pasa por funciones del servidor, que entregan porciones y tienen tope por persona o conexión.
-- 2) Cuando alguien se pasa del tope queda un aviso para el administrador (posible copia del corpus).
-- Aplicada el 16/11/2026, después de publicar el código que lee estas tablas desde el servidor.

drop policy if exists "Anyone can view published words" on public.corpus_words;
drop policy if exists "Anyone can view words of published lessons" on public.lesson_words;
drop policy if exists "juego_textos_select" on public.juego_textos;
drop policy if exists "mostrador_select" on public.mostrador_frases;

create table if not exists public.corpus_alertas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (char_length(tipo) <= 60),
  ip text check (ip is null or char_length(ip) <= 80),
  user_id uuid references auth.users(id) on delete set null,
  limite_por_hora integer not null,
  created_at timestamptz not null default now()
);

create index if not exists corpus_alertas_created_idx on public.corpus_alertas (created_at desc);

-- Solo el servidor lee y escribe (RLS activo, sin políticas).
alter table public.corpus_alertas enable row level security;
