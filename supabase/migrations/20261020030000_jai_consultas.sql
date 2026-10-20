-- Jai (atención al cliente): registro anónimo de consultas para mejorar las respuestas.
-- No guarda quién preguntó. El servidor recorta el texto y borra correos y números largos.
create table if not exists public.jai_consultas (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (char_length(texto) between 1 and 200),
  ruta text not null default '/' check (char_length(ruta) <= 120),
  resultado text not null check (resultado in ('respondida', 'opciones', 'derivada', 'no-util')),
  faq_id text check (faq_id is null or char_length(faq_id) <= 40),
  created_at timestamptz not null default now()
);
create index if not exists jai_consultas_fecha_idx on public.jai_consultas (created_at desc);
alter table public.jai_consultas enable row level security;
drop policy if exists "jai_consultas_select_admin" on public.jai_consultas;
create policy "jai_consultas_select_admin" on public.jai_consultas
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));
-- Escritura: solo desde el servidor (service role), con límite por IP.
