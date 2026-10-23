-- Buzón de sugerencias de Jai: se guarda como un tipo más de consulta anónima.
alter table public.jai_consultas drop constraint if exists jai_consultas_resultado_check;
alter table public.jai_consultas add constraint jai_consultas_resultado_check
  check (resultado in ('respondida', 'opciones', 'derivada', 'no-util', 'sugerencia'));
