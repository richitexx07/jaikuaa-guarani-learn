-- Dos juegos nuevos de «Guaraní para el trabajo»: Ventanilla de Jai y Jai en la chacra.
alter table public.juego_textos drop constraint if exists juego_textos_juego_check;
alter table public.juego_textos add constraint juego_textos_juego_check
  check (juego in ('trivia', 'tekojoja', 'karaoke', 'tembiu', 'taanga', 'chacra'));

alter table public.retos drop constraint if exists retos_juego_check;
alter table public.retos add constraint retos_juego_check
  check (juego in ('penales', 'ahorcado', 'memoria', 'sopa', 'tembiu', 'taanga', 'tekojoja', 'karaoke', 'trivia', 'consultorio', 'ventanilla', 'chacra'));
