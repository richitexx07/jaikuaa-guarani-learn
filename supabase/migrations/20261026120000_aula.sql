-- Aula para docentes: el docente arma su grupo con un código, asigna lecciones y juegos con fecha,
-- ve el avance de cada alumno y entrega constancias de participación.
-- Los alumnos entran solos con el código (eligen compartir su avance con ese docente).
-- El docente solo ve el nombre y el avance de sus alumnos, nunca el correo.
-- Todas las escrituras pasan por el servidor (service role) después de verificar quién es quién.

-- 1) Docentes de aula: los habilita el administrador (los admin y docentes validadores ya lo están).
create table if not exists public.aula_docentes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institucion text not null check (char_length(institucion) between 2 and 120),
  nota text not null default '' check (char_length(nota) <= 300),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  decidido_por uuid references auth.users(id),
  decidido_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.aula_docentes enable row level security;
drop policy if exists "aula_docentes_select" on public.aula_docentes;
create policy "aula_docentes_select" on public.aula_docentes
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Aulas.
create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 80),
  institucion text not null default '' check (char_length(institucion) <= 120),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{6}$'),
  docente_id uuid not null references auth.users(id) on delete cascade,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists aulas_docente_idx on public.aulas (docente_id, created_at desc);
alter table public.aulas enable row level security;

-- 3) Alumnos de cada aula.
create table if not exists public.aula_miembros (
  aula_id uuid not null references public.aulas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (aula_id, user_id)
);
create index if not exists aula_miembros_user_idx on public.aula_miembros (user_id);
alter table public.aula_miembros enable row level security;

-- 4) Tareas: una lección o un juego, con fecha límite opcional.
create table if not exists public.aula_tareas (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.aulas(id) on delete cascade,
  tipo text not null check (tipo in ('leccion', 'juego')),
  ref text not null check (char_length(ref) between 1 and 60),
  titulo text not null check (char_length(titulo) between 1 and 120),
  nota text not null default '' check (char_length(nota) <= 300),
  fecha_limite date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists aula_tareas_aula_idx on public.aula_tareas (aula_id, created_at);
alter table public.aula_tareas enable row level security;

-- Lectura directa mínima (sin cruzar tablas, para evitar políticas recursivas): cada uno ve su fila;
-- el administrador ve todo. Todo lo demás (avance, tareas, alumnos) lo arma el servidor.
drop policy if exists "aulas_select" on public.aulas;
create policy "aulas_select" on public.aulas
  for select to authenticated
  using (docente_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "aula_miembros_select" on public.aula_miembros;
create policy "aula_miembros_select" on public.aula_miembros
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "aula_tareas_select" on public.aula_tareas;
create policy "aula_tareas_select" on public.aula_tareas
  for select to authenticated
  using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));
