-- Traducción de los textos en castellano de los juegos (preguntas, historias, explicaciones) a otros idiomas.
-- Las propuestas viven en el código (src/lib/traducciones-juegos.ts); acá se guarda solo lo que un docente
-- (editor) o la administración aprobó, y recién eso se muestra.
-- La clave es el texto en castellano tal cual: si un docente cambia ese texto, la traducción vieja deja de usarse sola.
-- El guaraní nunca se traduce. Nadie lee esta tabla directo desde el navegador: todo pasa por funciones del servidor.
create table if not exists public.textos_traducidos (
  es text not null check (char_length(es) between 1 and 500),
  lang text not null check (lang in ('en','pt','de','fr','zh')),
  juego text not null check (char_length(juego) <= 40),
  aprobado text not null check (char_length(aprobado) between 1 and 500),
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_at timestamptz not null default now(),
  primary key (es, lang)
);
alter table public.textos_traducidos enable row level security;
