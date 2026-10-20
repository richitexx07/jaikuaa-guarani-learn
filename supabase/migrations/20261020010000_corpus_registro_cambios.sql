-- Recomendación de la revisión de seguridad (19/10/2026):
-- 1) Los docentes ya no pueden modificar palabras del corpus directamente contra la base.
--    Todo cambio pasa por las funciones del servidor, que verifican el rol.
-- 2) Cada cambio de un docente queda registrado: quién, cuándo, y el antes y el después.

drop policy if exists "Editors update words" on public.corpus_words;

create table if not exists public.corpus_word_changes (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.corpus_words(id) on delete cascade,
  changed_by uuid not null references auth.users(id),
  changes jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists corpus_word_changes_word_idx on public.corpus_word_changes (word_id, created_at desc);

alter table public.corpus_word_changes enable row level security;
create policy "corpus_word_changes_select_admin" on public.corpus_word_changes
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));
-- Escritura: solo desde el servidor (service role).
