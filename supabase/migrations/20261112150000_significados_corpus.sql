-- Significados de cada palabra en los otros idiomas de la app (inglés, portugués, alemán, francés, chino).
-- Es la traducción del SIGNIFICADO en castellano; el guaraní nunca se toca.
-- significados_propuestos: propuestas que todavía no se muestran.
-- significados: lo que un docente (editor) o la administración revisó y aprobó; recién eso se ve en las lecciones.
-- significados_revision: quién aprobó cada idioma y cuándo.
alter table public.corpus_words
  add column if not exists significados jsonb not null default '{}'::jsonb,
  add column if not exists significados_propuestos jsonb not null default '{}'::jsonb,
  add column if not exists significados_revision jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.corpus_words add constraint corpus_words_significados_obj check (
    jsonb_typeof(significados) = 'object' and jsonb_typeof(significados_propuestos) = 'object' and jsonb_typeof(significados_revision) = 'object'
  );
exception when duplicate_object then null; end $$;
