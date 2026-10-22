-- Respuestas de práctica (una fila por pregunta respondida) para que el docente vea qué palabras
-- le cuestan a su grupo. Solo guarda la palabra y si acertó; nada de lo que escribe el alumno.
create table if not exists public.practice_answers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  gn text not null check (char_length(gn) between 1 and 120),
  correct boolean not null,
  source text not null check (source in ('lesson', 'wotd', 'game')),
  source_ref text check (source_ref is null or char_length(source_ref) <= 60),
  answered_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists practice_answers_user_fecha_idx on public.practice_answers (user_id, answered_at desc);
alter table public.practice_answers enable row level security;
-- Sin políticas: se escribe y se lee solo desde el servidor (con permisos de servicio).
