-- Convenios firmados en línea (Purahéi Jaikuaa y Librería Jaikuaa).
-- Firma electrónica (Ley 6822/2021) desde una cuenta con el correo confirmado: se guarda quién, cuándo,
-- desde qué dispositivo, la versión y una huella (SHA-256) del texto exacto aceptado.
-- Lo firmado no se puede cambiar después (lo impide un disparador); solo cambian el estado, la nota del
-- equipo y el adjunto (el convenio firmado con firma cualificada o a mano).
-- Nadie lee esta tabla directo desde el navegador: todo pasa por funciones del servidor.

create table if not exists public.convenios_firmados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^CV-[0-9]{4}-[A-Z2-9]{6}$'),
  programa text not null check (programa in ('purahei', 'libreria')),
  version text not null check (char_length(version) between 1 and 40),
  huella text not null check (huella ~ '^[0-9a-f]{64}$'),
  user_id uuid references auth.users(id) on delete set null,
  email text not null check (char_length(email) between 3 and 255),
  nombre text not null check (char_length(nombre) between 3 and 120),
  ci text not null check (ci ~ '^[0-9A-Z]{4,15}$'),
  whatsapp text not null check (whatsapp ~ '^[0-9]{8,15}$'),
  ciudad text not null default '' check (char_length(ciudad) <= 120),
  roles text[] not null check (cardinality(roles) between 1 and 6),
  permisos text[] not null check (cardinality(permisos) between 1 and 10),
  obras jsonb not null check (jsonb_typeof(obras) = 'array' and jsonb_array_length(obras) between 1 and 30),
  ip text not null default '' check (char_length(ip) <= 64),
  dispositivo text not null default '' check (char_length(dispositivo) <= 300),
  firmado_at timestamptz not null default now(),
  adjunto_path text check (char_length(adjunto_path) <= 300),
  adjunto_tipo text check (adjunto_tipo in ('cualificada', 'manuscrita')),
  adjunto_at timestamptz,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado', 'retiro_pedido', 'retirado')),
  nota text not null default '' check (char_length(nota) <= 1000),
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_at timestamptz,
  artista_id uuid references public.purahei_artistas(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists convenios_firmados_user_idx on public.convenios_firmados (user_id);
create index if not exists convenios_firmados_estado_idx on public.convenios_firmados (programa, estado, firmado_at desc);

alter table public.convenios_firmados enable row level security;

-- Lo firmado queda fijo.
create or replace function public.convenios_firmados_inmutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.codigo is distinct from old.codigo
     or new.programa is distinct from old.programa
     or new.version is distinct from old.version
     or new.huella is distinct from old.huella
     or new.email is distinct from old.email
     or new.nombre is distinct from old.nombre
     or new.ci is distinct from old.ci
     or new.whatsapp is distinct from old.whatsapp
     or new.ciudad is distinct from old.ciudad
     or new.roles is distinct from old.roles
     or new.permisos is distinct from old.permisos
     or new.obras is distinct from old.obras
     or new.ip is distinct from old.ip
     or new.dispositivo is distinct from old.dispositivo
     or new.firmado_at is distinct from old.firmado_at
     or (new.user_id is distinct from old.user_id and new.user_id is not null) then
    raise exception 'Un convenio firmado no se puede modificar';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists convenios_firmados_inmutable on public.convenios_firmados;
create trigger convenios_firmados_inmutable
  before update on public.convenios_firmados
  for each row execute function public.convenios_firmados_inmutable();

-- Depósito privado para el convenio firmado que adjunta el Titular (PDF o foto).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('convenios', 'convenios', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
