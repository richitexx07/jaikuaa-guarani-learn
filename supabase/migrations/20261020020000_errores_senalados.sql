-- Piloto con el Ateneo (Etapa 0): los docentes señalan errores en palabras, significados o audios.
-- Cada aviso queda guardado con quién lo hizo y dónde; el equipo docente lo revisa en el
-- Circuito de validación. Nada se corrige solo: la corrección entra por el circuito de tres pasos.

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid not null references auth.users(id) on delete cascade,
  word_gn text not null check (char_length(word_gn) between 1 and 200),
  word_es text not null default '' check (char_length(word_es) <= 300),
  lugar text not null check (char_length(lugar) between 1 and 120),
  tipo text not null check (tipo in ('escritura', 'significado', 'audio', 'otro')),
  mensaje text not null check (char_length(mensaje) between 3 and 500),
  estado text not null default 'abierto' check (estado in ('abierto', 'resuelto', 'descartado')),
  created_at timestamptz not null default now(),
  revisado_por uuid references auth.users(id),
  revisado_at timestamptz
);

create index if not exists content_reports_estado_idx on public.content_reports (estado, created_at desc);
create index if not exists content_reports_autor_idx on public.content_reports (reported_by, created_at desc);

alter table public.content_reports enable row level security;

-- Cada usuario ve solo sus propios avisos; los administradores ven todos.
create policy "content_reports_select_own" on public.content_reports
  for select to authenticated
  using (reported_by = auth.uid());

create policy "content_reports_select_admin" on public.content_reports
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- Escritura: solo desde el servidor (service role), que controla el rol y el límite diario.
