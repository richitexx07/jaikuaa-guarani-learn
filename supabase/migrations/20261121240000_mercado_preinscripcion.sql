-- Mercado en preinscripción: mientras las ventas no estén abiertas, el Mercado se ve como vitrina,
-- recibe inscripciones de vendedores y anota a quienes quieren que les avisemos cuando abra.
alter table public.libreria_ajustes add column if not exists mercado_abierto boolean not null default false;

create table if not exists public.mercado_interesados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  contacto text not null check (char_length(contacto) between 5 and 120),
  interes text not null default 'todo' check (interes in ('todo','libros','modulos','cursos','artesania','musica','clases','traducciones','experiencias','empresas','otros')),
  user_id uuid references auth.users(id) on delete set null,
  avisado boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists mercado_interesados_contacto_idx on public.mercado_interesados (lower(contacto));
-- Solo el servidor lee y escribe (sin políticas: nadie entra con la llave pública).
alter table public.mercado_interesados enable row level security;
