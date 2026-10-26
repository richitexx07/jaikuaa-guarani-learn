-- Modo mostrador «Atendé en guaraní»: frases para que un profesional (médico, funcionario, cajero)
-- le haga escuchar a la persona que atiende la frase grabada por un hablante paraguayo.
-- El equipo técnico solo carga la frase en castellano. El guaraní lo escribe un docente validador
-- y lo valida OTRO docente; recién entonces la frase se publica. Sin grabación humana no se publica.

create table if not exists public.mostrador_frases (
  id uuid primary key default gen_random_uuid(),
  rubro text not null check (rubro in ('salud', 'atencion')),
  situacion text not null check (char_length(situacion) between 1 and 80),
  -- decir: lo que dice quien atiende · escuchar: respuestas comunes que puede recibir
  tipo text not null default 'decir' check (tipo in ('decir', 'escuchar')),
  es text not null check (char_length(es) between 1 and 300),
  gn text check (gn is null or char_length(gn) between 1 and 300),
  gn_by uuid references auth.users(id),
  gn_at timestamptz,
  audio_path text,
  audio_by uuid references auth.users(id),
  orden integer not null default 0,
  status text not null default 'pendiente' check (status in ('pendiente', 'publicada')),
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mostrador_rubro_es_unique unique (rubro, es),
  -- Quien escribió el guaraní no puede validarlo.
  constraint mostrador_validador_distinto check (validated_by is null or gn_by is null or validated_by <> gn_by),
  -- Publicada = con guaraní, con grabación humana y con validación.
  constraint mostrador_publicada_completa check (
    status <> 'publicada' or (gn is not null and audio_path is not null and validated_by is not null)
  )
);

create index if not exists mostrador_frases_rubro_idx on public.mostrador_frases (rubro, status, orden);

alter table public.mostrador_frases enable row level security;

-- Lectura: cualquier cuenta ve las frases publicadas; admin y docentes validadores ven todas.
-- Escritura: solo desde el servidor (service role), después de verificar el rol.
drop policy if exists "mostrador_select" on public.mostrador_frases;
create policy "mostrador_select" on public.mostrador_frases
  for select to authenticated
  using (
    status = 'publicada'
    or public.has_role(auth.uid(), 'admin'::app_role)
    or public.has_role(auth.uid(), 'editor'::app_role)
  );

-- Frases iniciales, solo en castellano. El guaraní lo cargan los docentes.
insert into public.mostrador_frases (rubro, situacion, tipo, es, orden) values
  -- Salud
  ('salud', 'Recepción', 'decir', 'Buen día. ¿Cómo se llama?', 10),
  ('salud', 'Recepción', 'decir', '¿Cuántos años tiene?', 11),
  ('salud', 'Recepción', 'decir', '¿Dónde vive?', 12),
  ('salud', 'Recepción', 'decir', '¿Vino con alguien?', 13),
  ('salud', 'Recepción', 'decir', 'Espere un momento, por favor.', 14),
  ('salud', '¿Qué le pasa?', 'decir', '¿Qué le pasa?', 20),
  ('salud', '¿Qué le pasa?', 'decir', '¿Dónde le duele?', 21),
  ('salud', '¿Qué le pasa?', 'decir', 'Muéstreme con el dedo dónde le duele.', 22),
  ('salud', '¿Qué le pasa?', 'decir', '¿Desde cuándo le duele?', 23),
  ('salud', '¿Qué le pasa?', 'decir', '¿Tiene fiebre?', 24),
  ('salud', '¿Qué le pasa?', 'decir', '¿Tomó algún remedio?', 25),
  ('salud', '¿Qué le pasa?', 'decir', '¿Es alérgico a algún remedio?', 26),
  ('salud', '¿Qué le pasa?', 'decir', '¿Está embarazada?', 27),
  ('salud', 'Revisión', 'decir', 'Siéntese aquí, por favor.', 30),
  ('salud', 'Revisión', 'decir', 'Acuéstese aquí, por favor.', 31),
  ('salud', 'Revisión', 'decir', 'Respire hondo.', 32),
  ('salud', 'Revisión', 'decir', 'Abra la boca.', 33),
  ('salud', 'Revisión', 'decir', 'Le voy a tomar la presión.', 34),
  ('salud', 'Revisión', 'decir', 'Le voy a revisar. No se preocupe.', 35),
  ('salud', 'Indicaciones', 'decir', 'Tome este remedio cada ocho horas.', 40),
  ('salud', 'Indicaciones', 'decir', 'Tome mucha agua.', 41),
  ('salud', 'Indicaciones', 'decir', 'Necesita hacerse un análisis de sangre.', 42),
  ('salud', 'Indicaciones', 'decir', 'Vuelva en una semana.', 43),
  ('salud', 'Indicaciones', 'decir', 'Si se siente peor, vuelva enseguida.', 44),
  ('salud', 'Indicaciones', 'decir', 'Firme aquí, por favor.', 45),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele la cabeza.', 50),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele la panza.', 51),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele el pecho.', 52),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Tengo fiebre.', 53),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Tengo tos.', 54),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Estoy mareado.', 55),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele mucho.', 56),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Desde ayer.', 57),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Desde hace una semana.', 58),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Sí.', 59),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'No.', 60),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'No entiendo.', 61),
  -- Atención al público
  ('atencion', 'Saludo', 'decir', 'Buen día. ¿En qué le puedo ayudar?', 10),
  ('atencion', 'Saludo', 'decir', 'Pase, por favor.', 11),
  ('atencion', 'Saludo', 'decir', 'Tome asiento, por favor.', 12),
  ('atencion', 'Trámite', 'decir', '¿Me presta su cédula?', 20),
  ('atencion', 'Trámite', 'decir', 'Necesito una fotocopia de su cédula.', 21),
  ('atencion', 'Trámite', 'decir', 'Complete este formulario, por favor.', 22),
  ('atencion', 'Trámite', 'decir', 'Firme aquí, por favor.', 23),
  ('atencion', 'Trámite', 'decir', 'Su trámite está listo.', 24),
  ('atencion', 'Trámite', 'decir', 'Su trámite todavía no está listo.', 25),
  ('atencion', 'Turnos y espera', 'decir', 'Espere un momento, por favor.', 30),
  ('atencion', 'Turnos y espera', 'decir', 'Saque un número y espere su turno.', 31),
  ('atencion', 'Turnos y espera', 'decir', 'Vuelva mañana, por favor.', 32),
  ('atencion', 'Despedida', 'decir', '¿Necesita algo más?', 40),
  ('atencion', 'Despedida', 'decir', 'Muchas gracias.', 41),
  ('atencion', 'Despedida', 'decir', 'Que tenga un buen día.', 42),
  ('atencion', 'Lo que le pueden responder', 'escuchar', 'Vine a hacer un trámite.', 50),
  ('atencion', 'Lo que le pueden responder', 'escuchar', '¿Cuánto cuesta?', 51),
  ('atencion', 'Lo que le pueden responder', 'escuchar', '¿Dónde queda?', 52),
  ('atencion', 'Lo que le pueden responder', 'escuchar', '¿Puede repetir, por favor?', 53),
  ('atencion', 'Lo que le pueden responder', 'escuchar', 'No entiendo.', 54),
  ('atencion', 'Lo que le pueden responder', 'escuchar', 'Gracias.', 55)
on conflict (rubro, es) do nothing;
