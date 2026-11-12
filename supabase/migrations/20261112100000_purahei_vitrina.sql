-- Purahéi Jaikuaa: vitrina de artistas y cantores paraguayos.
-- Cada artista tiene su ficha (con WhatsApp directo, sin comisiones por contrataciones) y sus obras:
-- letra bilingüe, glosario poético (escrito por docentes), voz real del artista y su versión para el karaoke.
-- Nadie del equipo técnico escribe guaraní: la letra y el glosario los cargan docentes (rol editor) o el admin,
-- y una obra solo se publica con los permisos de sus dueños y la revisión de un docente distinto de quien la cargó.
-- Nadie lee estas tablas directo desde el navegador: todo pasa por funciones del servidor.

create table if not exists public.purahei_artistas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  nombre text not null check (char_length(nombre) between 1 and 120),
  ciudad text not null default '' check (char_length(ciudad) <= 120),
  bio text not null default '' check (char_length(bio) <= 3000),
  foto_path text check (char_length(foto_path) <= 300),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  contacto text not null default '' check (char_length(contacto) <= 120),
  enlaces jsonb not null default '[]'::jsonb check (jsonb_typeof(enlaces) = 'array' and jsonb_array_length(enlaces) <= 8),
  permiso_imagen boolean not null default false,
  publicado boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Sin autorización de imagen, la ficha no sale al público.
  constraint purahei_artista_publicable check (not publicado or permiso_imagen)
);

create table if not exists public.purahei_obras (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid not null references public.purahei_artistas(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 200),
  autor text not null default '' check (char_length(autor) <= 200),
  interprete text not null default '' check (char_length(interprete) <= 200),
  productor text not null default '' check (char_length(productor) <= 200),
  anio integer check (anio is null or anio between 1500 and 2100),
  estilo text not null default 'otro' check (estilo in ('polca', 'guarania', 'galopa', 'otro')),
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  -- [{gn, es}] — la letra verso por verso.
  versos jsonb not null default '[]'::jsonb check (jsonb_typeof(versos) = 'array' and jsonb_array_length(versos) <= 120),
  -- [{termino, nota}] — el glosario poético.
  glosario jsonb not null default '[]'::jsonb check (jsonb_typeof(glosario) = 'array' and jsonb_array_length(glosario) <= 80),
  -- {bpm, versos: [{verso, gap, wrong: [a, b]}]} — la versión para Purahéi Karaoke (null = sin karaoke).
  karaoke jsonb check (karaoke is null or jsonb_typeof(karaoke) = 'object'),
  audio_path text check (char_length(audio_path) <= 300),
  permiso_autor boolean not null default false,
  permiso_interprete boolean not null default false,
  permiso_productor boolean not null default false,
  cargado_por uuid references auth.users(id) on delete set null,
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_at timestamptz,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Publicar exige: permiso del autor, revisión docente y, si se usa la grabación, permiso del intérprete y del productor.
  constraint purahei_obra_publicable check (
    not publicado or (
      permiso_autor and revisado_por is not null
      and (audio_path is null or (permiso_interprete and permiso_productor))
    )
  )
);

create index if not exists purahei_obras_artista_idx on public.purahei_obras (artista_id);

alter table public.purahei_artistas enable row level security;
alter table public.purahei_obras enable row level security;

-- Depósito privado para fotos y grabaciones: el servidor entrega enlaces firmados de corta duración.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('purahei', 'purahei', false, 31457280,
        array['image/webp','image/jpeg','image/png','audio/mpeg','audio/mp4','audio/webm','audio/ogg','audio/wav','audio/x-m4a'])
on conflict (id) do nothing;
