-- Frases nuevas del Consultorio, SOLO en castellano. El guaraní y la grabación los cargan los docentes.
insert into public.mostrador_frases (rubro, situacion, tipo, es, orden) values
  ('salud', 'Remedios', 'decir', 'Tome este remedio antes de comer.', 50),
  ('salud', 'Remedios', 'decir', 'Tome este remedio después de comer.', 51),
  ('salud', 'Remedios', 'decir', 'Tome una pastilla a la mañana y otra a la noche.', 52),
  ('salud', 'Remedios', 'decir', 'No tome este remedio con alcohol.', 53),
  ('salud', 'Remedios', 'decir', 'Póngase esta crema dos veces por día.', 54),
  ('salud', 'Remedios', 'decir', 'Le voy a poner una inyección.', 55),
  ('salud', 'Remedios', 'decir', '¿Toma algún yuyo o remedio casero?', 56),
  ('salud', 'Remedios', 'decir', 'Termine todo el remedio aunque se sienta mejor.', 57),
  ('salud', '¿Qué le pasa?', 'decir', '¿Le duele la garganta?', 28),
  ('salud', '¿Qué le pasa?', 'decir', '¿Le duelen los dientes?', 29),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele la garganta.', 70),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele la espalda.', 71),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele el oído.', 72),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele la muela.', 73),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele la mano.', 74),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Me duele el pie.', 75),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Tengo vómitos.', 76),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Tengo diarrea.', 77),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Ya tomé un remedio.', 78),
  ('salud', 'Lo que le pueden responder', 'escuchar', 'Tomé un yuyo.', 79)
on conflict (rubro, es) do nothing;