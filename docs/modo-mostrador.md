# Modo mostrador «Atendé en guaraní»

Quien atiende (médico, funcionario, cajero) elige una frase y se la hace escuchar a la persona: la grabó un hablante paraguayo y la validaron docentes.

## Cómo se carga una frase
1. El administrador carga la frase en castellano (rubro, situación, si la dice quien atiende o si es una respuesta que se escucha).
2. Un docente validador escribe el guaraní en `/mostrador/editar`.
3. Se graba la voz de un hablante (botón «Grabar voz» o subir un MP3).
4. **Otro** docente la escucha y toca «Validar y publicar». Quien escribió el guaraní no puede validarla (lo controlan el servidor y la base).

Si se corrige la escritura, la frase pierde la grabación y la validación y vuelve a empezar.

## Datos
- Tabla `mostrador_frases` (migración `20261026100000_mostrador.sql`), aplicada en Lovable Cloud el 26/10/2026 con 58 frases iniciales en castellano (37 de salud, 21 de atención al público).
- Grabaciones en el bucket `guarani-audio`, carpeta `mostrador/<id>.mp3`.
- Los usuarios solo reciben frases publicadas. Con «Guardar en el teléfono» las grabaciones suenan sin señal.
