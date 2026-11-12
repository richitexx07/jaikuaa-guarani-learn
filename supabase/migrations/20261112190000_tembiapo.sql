-- Tembiapo Jaikuaa: vitrina de maestros artesanos y saberes vivos del Paraguay.
-- Cada artesano tiene su ficha (con WhatsApp directo, sin comisiones por ventas), sus piezas y las palabras
-- de su oficio (con su voz). Las rutas culturales agrupan a los artesanos de los pueblos de una zona.
-- Nadie del equipo técnico escribe guaraní: las palabras las cargan docentes (rol editor) o la administración,
-- y una palabra solo se publica con la revisión de un docente distinto de quien la cargó.
-- Lectura pública: el público ve solo lo publicado, siempre a través de funciones del servidor; nadie lee
-- estas tablas directo desde el navegador (así los datos sin publicar y los permisos nunca salen).

create table if not exists public.tembiapo_rutas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  nombre text not null check (char_length(nombre) between 1 and 120),
  descripcion text not null default '' check (char_length(descripcion) <= 3000),
  -- Pueblos o ciudades de la ruta, en orden.
  lugares jsonb not null default '[]'::jsonb check (jsonb_typeof(lugares) = 'array' and jsonb_array_length(lugares) <= 20),
  foto_path text check (char_length(foto_path) <= 300),
  auspiciante text not null default '' check (char_length(auspiciante) <= 120),
  auspiciante_url text check (auspiciante_url is null or auspiciante_url ~ '^https://'),
  orden integer not null default 0,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tembiapo_artesanos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  nombre text not null check (char_length(nombre) between 1 and 120),
  oficio text not null check (oficio in ('nanduti', 'ao-poi', 'filigrana', 'ceramica', 'poncho', 'tallado', 'cuero', 'indigena', 'otro')),
  ciudad text not null default '' check (char_length(ciudad) <= 120),
  departamento text not null default '' check (char_length(departamento) <= 60),
  -- Para el arte indígena: el pueblo o la comunidad, como ellos se nombran.
  comunidad text not null default '' check (char_length(comunidad) <= 120),
  ruta_id uuid references public.tembiapo_rutas(id) on delete set null,
  bio text not null default '' check (char_length(bio) <= 3000),
  foto_path text check (char_length(foto_path) <= 300),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  contacto text not null default '' check (char_length(contacto) <= 120),
  -- «Maestro artesano» solo con reconocimiento del Instituto Paraguayo de Artesanía.
  maestro_ipa boolean not null default false,
  permiso_imagen boolean not null default false,
  -- El arte indígena se publica solo con el consentimiento de la comunidad.
  consentimiento_comunidad boolean not null default false,
  publicado boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tembiapo_artesano_publicable check (
    not publicado or (permiso_imagen and (oficio <> 'indigena' or consentimiento_comunidad))
  )
);

create table if not exists public.tembiapo_piezas (
  id uuid primary key default gen_random_uuid(),
  artesano_id uuid not null references public.tembiapo_artesanos(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 160),
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  tecnica text not null default '' check (char_length(tecnica) <= 160),
  materiales text not null default '' check (char_length(materiales) <= 200),
  medidas text not null default '' check (char_length(medidas) <= 120),
  tiempo text not null default '' check (char_length(tiempo) <= 120),
  -- Hasta 6 fotos: rutas en el depósito «tembiapo».
  fotos jsonb not null default '[]'::jsonb check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 6),
  orden integer not null default 0,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tembiapo_pieza_publicable check (not publicado or jsonb_array_length(fotos) >= 1)
);

-- Las palabras de cada oficio: el término en guaraní (lo carga un docente), su significado en castellano,
-- y la grabación con la voz del artesano. De un oficio en general o de un artesano en particular.
create table if not exists public.tembiapo_glosario (
  id uuid primary key default gen_random_uuid(),
  oficio text not null check (oficio in ('nanduti', 'ao-poi', 'filigrana', 'ceramica', 'poncho', 'tallado', 'cuero', 'indigena', 'otro')),
  artesano_id uuid references public.tembiapo_artesanos(id) on delete cascade,
  termino text not null check (char_length(termino) between 1 and 80),
  significado text not null default '' check (char_length(significado) <= 600),
  audio_path text check (char_length(audio_path) <= 300),
  cargado_por uuid references auth.users(id) on delete set null,
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_at timestamptz,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Publicar exige la revisión de un docente distinto de quien cargó la palabra.
  constraint tembiapo_termino_publicable check (
    not publicado or (revisado_por is not null and revisado_por is distinct from cargado_por and char_length(significado) > 0)
  )
);

create index if not exists tembiapo_artesanos_oficio_idx on public.tembiapo_artesanos (oficio) where publicado;
create index if not exists tembiapo_artesanos_ruta_idx on public.tembiapo_artesanos (ruta_id);
create index if not exists tembiapo_piezas_artesano_idx on public.tembiapo_piezas (artesano_id);
create index if not exists tembiapo_glosario_oficio_idx on public.tembiapo_glosario (oficio);
create index if not exists tembiapo_glosario_artesano_idx on public.tembiapo_glosario (artesano_id);

alter table public.tembiapo_rutas enable row level security;
alter table public.tembiapo_artesanos enable row level security;
alter table public.tembiapo_piezas enable row level security;
alter table public.tembiapo_glosario enable row level security;

-- El convenio artesanal en línea usa el mismo sistema de convenios firmados.
alter table public.convenios_firmados drop constraint if exists convenios_firmados_programa_check;
alter table public.convenios_firmados add constraint convenios_firmados_programa_check
  check (programa in ('purahei', 'libreria', 'tembiapo'));
alter table public.convenios_firmados add column if not exists artesano_id uuid references public.tembiapo_artesanos(id) on delete set null;

-- Depósito privado para fotos y grabaciones: el servidor entrega enlaces firmados de corta duración.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tembiapo', 'tembiapo', false, 31457280,
        array['image/webp','image/jpeg','image/png','audio/mpeg','audio/mp4','audio/webm','audio/ogg','audio/wav','audio/x-m4a'])
on conflict (id) do nothing;
