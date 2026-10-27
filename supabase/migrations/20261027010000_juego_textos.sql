-- Guaraní de los juegos: lo que escriben o corrigen los docentes validadores para los juegos que
-- tienen su contenido dentro de la app (Preguntados, Tekojoja, Karaoke, Tembi'u, Ta'anga).
-- Nadie del equipo técnico escribe guaraní: cada fila la carga un docente (rol "editor") o el admin,
-- y queda su nombre. Los juegos muestran lo que hay acá en lugar del texto de la app.

create table if not exists public.juego_textos (
  id uuid primary key default gen_random_uuid(),
  juego text not null check (juego in ('trivia', 'tekojoja', 'karaoke', 'tembiu', 'taanga')),
  -- Qué elemento del juego (por ejemplo «gastronomia:3» o «5»).
  clave text not null check (char_length(clave) between 1 and 80),
  -- Qué parte de ese elemento (por ejemplo «pregunta», «termino», «verso» o «revisado»).
  campo text not null check (char_length(campo) between 1 and 40),
  texto text not null check (char_length(texto) between 1 and 600),
  escrito_por uuid references auth.users(id),
  escrito_por_nombre text,
  updated_at timestamptz not null default now(),
  constraint juego_textos_unico unique (juego, clave, campo)
);

alter table public.juego_textos enable row level security;

-- Lectura: cualquier cuenta (los juegos lo muestran). Escritura: solo desde el servidor, después de
-- verificar que quien escribe es docente validador o admin.
drop policy if exists "juego_textos_select" on public.juego_textos;
create policy "juego_textos_select" on public.juego_textos
  for select to authenticated
  using (true);
