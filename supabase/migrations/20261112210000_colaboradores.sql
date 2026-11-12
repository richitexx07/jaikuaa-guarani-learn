-- Colaboradores de Jaikuaa: docentes, supervisores, traductores y hablantes que quieren sumarse.
-- Se postulan desde /colaboradores (también con el QR que se reparte en congresos y escuelas).
-- El equipo (administración y docentes) revisa cada postulación y decide a quién llamar.
-- Nadie lee esta tabla desde el navegador: todo pasa por funciones del servidor (RLS activo, sin políticas).

create table if not exists public.colaboradores_postulaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 3 and 120),
  departamento text not null check (char_length(departamento) between 2 and 60),
  ciudad text not null default '' check (char_length(ciudad) <= 120),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  email text check (email is null or (char_length(email) between 5 and 255 and email like '%@%')),
  perfil text not null check (perfil in ('docente', 'supervisor', 'docente_indigena', 'licenciado', 'traductor', 'estudiante', 'hablante', 'otro')),
  institucion text not null default '' check (char_length(institucion) <= 160),
  lenguas text not null default '' check (char_length(lenguas) <= 200),
  aportes text[] not null check (cardinality(aportes) between 1 and 6),
  capacitacion boolean not null default false,
  comentario text not null default '' check (char_length(comentario) <= 800),
  origen text not null default '' check (char_length(origen) <= 40),
  estado text not null default 'nuevo' check (estado in ('nuevo', 'contactado', 'seleccionado', 'descartado')),
  nota_interna text not null default '' check (char_length(nota_interna) <= 600),
  revisado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint colaboradores_contacto check (whatsapp is not null or email is not null)
);

create index if not exists colaboradores_created_idx on public.colaboradores_postulaciones (created_at desc);
create index if not exists colaboradores_estado_idx on public.colaboradores_postulaciones (estado);

alter table public.colaboradores_postulaciones enable row level security;
