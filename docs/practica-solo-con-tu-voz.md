# Jaikuaa · Práctica «Empezar: solo con tu voz»

**Pantalla:** Grabate y compará (www.jaikuaa.com/pronunciar)
**Fecha:** 16 de noviembre de 2026
**Estado:** terminado y probado. Se publica cuando Richard dice «publicá».

---

## 1. Qué hace

La persona toca **una sola vez** el botón «Empezar: solo con tu voz». Después no vuelve a tocar nada: solo habla.

En cada palabra pasa esto, solo:

1. **Escuchá.** Suena la palabra en la voz real de un hablante paraguayo.
2. **Bip.** Un tono cortito avisa que ahora le toca a la persona. Es un tono, no una voz.
3. **Ahora vos.** La pantalla muestra «Ahora vos: decí «…»» y el teléfono empieza a escuchar.
4. **Te escucho.** Cuando detecta la voz, la pantalla cambia a «Te escucho…».
5. **Corte solo.** Cuando la persona termina de hablar, la grabación se corta sola.
6. **Limpieza.** Se recortan los silencios del principio y del final de la grabación.
7. **Compará.** Suena primero el hablante y después la persona, una detrás de la otra.
8. **Siguiente.** Pasa sola a otra palabra y vuelve a empezar.

Para terminar, se toca **«Parar»**.

---

## 2. Cómo se activa sola, paso a paso

### Paso 1 · Un solo toque abre todo

- Al tocar «Empezar», el teléfono pide permiso para usar el micrófono **una sola vez**.
- En ese mismo toque se habilita el sonido. Los teléfonos, sobre todo los iPhone, solo dejan usar el micrófono y el parlante si la persona tocó algo antes.
- El micrófono queda abierto durante toda la práctica, así no vuelve a pedir permiso en cada palabra.

### Paso 2 · Primero escucha el ruido del lugar

- Durante el primer cuarto de segundo de cada grabación, el teléfono mide cuánto ruido hay alrededor.
- A partir de esa medida decide qué cuenta como voz: tiene que sonar **por lo menos 3 veces más fuerte que el ruido**.
- Así funciona igual en una casa callada y en un aula con ruido.

### Paso 3 · Reconoce que la persona empezó a hablar

- Cuando el volumen pasa ese límite, marca el **inicio de la voz**.
- Un ruido muy cortito, como un golpe en la mesa o un clic, no cuenta como habla: tiene que durar más de 0,15 segundos.

### Paso 4 · Espera que termine (sin cortar antes de tiempo)

- Corta recién después de **0,9 segundos de silencio** seguidos.
- Si en 4 segundos la persona no habló, avisa «No te escuché. Otra vez…» y repite la palabra **una vez**.
- Si tampoco habla la segunda vez, la práctica se pausa sola y avisa: «Se pausó porque no te escuché. Tocá «Empezar» para seguir».
- Ninguna grabación pasa de 6 segundos.

### Paso 5 · Deja la grabación limpia

- Se queda solo con la parte donde hay voz.
- Antes de la voz deja un margen de **0,15 segundos**, para no comerse la primera consonante.
- Después de la voz deja **0,3 segundos**, para no cortar el final.
- Así las dos voces arrancan juntas al compararlas, y el dibujo de las ondas queda alineado.

### Paso 6 · Compara y sigue

- Suena el hablante, una pausa corta, y suena la persona.
- Después de casi un segundo pasa a otra palabra al azar.

---

## 3. Los patrones del habla guaraní que se tuvieron en cuenta

| Rasgo del guaraní | El riesgo | Cómo lo resuelve |
|---|---|---|
| **El puso** (la pausa cortita en el medio, como en «Mba'éichapa») | Que el teléfono crea que la persona terminó y corte la palabra por la mitad | Solo corta después de 0,9 segundos de silencio. El puso dura mucho menos, alrededor de una décima de segundo. |
| **Las vocales nasales** suenan más bajo | Que no las detecte como voz | El límite se calcula según el ruido del lugar, no es un número fijo alto |
| **Las consonantes del comienzo** («mb», «nd», «ng») arrancan suave | Que la grabación limpia se coma el comienzo | Se deja un margen de 0,15 segundos antes de la voz |
| **Los finales** se apagan despacio (vocales y nasales) | Que se corte el final de la palabra | Se deja un margen de 0,3 segundos después de la voz |
| **Las palabras de una sílaba** duran muy poco | Que no las cuente como habla | Con 0,15 segundos de voz ya alcanza |

Probado con una grabación de prueba que imita el puso (dos partes de voz con una pausa de 0,08 segundos en el medio): **no cortó**, y la grabación limpia quedó de 1,2 segundos.

---

## 4. Valores usados

| Qué | Valor |
|---|---|
| Medición del ruido al empezar | 0,25 segundos |
| La voz tiene que sonar más fuerte que el ruido | 3 veces |
| Volumen mínimo para contar como voz (aunque no haya nada de ruido) | 0,02 |
| Tiempo mínimo de voz para contar como habla | 0,15 segundos |
| Silencio que indica que terminó | 0,9 segundos |
| Espera máxima si no habla | 4 segundos |
| Largo máximo de cada grabación | 6 segundos |
| Margen antes de la voz | 0,15 segundos |
| Margen después de la voz | 0,3 segundos |
| Pausa entre el hablante y tu voz al comparar | 0,3 segundos |
| Pausa antes de pasar a la palabra siguiente | 0,9 segundos |

Si en el uso real corta muy pronto o tarda demasiado, estos números se ajustan sin cambiar nada más.

---

## 5. Privacidad y reglas de Jaikuaa

- **La grabación de la persona queda solo en su teléfono.** No se sube a ningún lado.
- **El micrófono se apaga** al tocar «Parar», al salir de la pantalla o al esconder la app.
- **No hay voces de computadora.** La única voz es la del hablante real. El aviso para hablar es un tono, no una voz.
- **No hay nota automática.** La persona compara de oído y mirando las ondas.
- **No se genera ni se corrige guaraní.** Solo se usan las palabras ya publicadas y revisadas por docentes especialistas.

---

## 6. Cómo se probó

1. **Pruebas automáticas** de cómo decide cuándo cortar:
   - corta cuando la persona termina;
   - no corta en el puso;
   - con ruido de fondo pide una voz más fuerte;
   - una palabra de una sílaba cuenta y un clic no;
   - avisa si nadie habla;
   - nunca graba más de 6 segundos;
   - el recorte limpio y el archivo de audio salen bien.
2. **Prueba completa en un celular simulado** (pantalla de 360 por 720) con un micrófono de prueba:
   - **Con voz:** recorrió solo tres palabras seguidas (escuchá, ahora vos, te escucho, compará, sigue otra palabra) y «Parar» lo detuvo.
   - **Sin voz:** avisó «No te escuché», repitió la palabra una vez y después se pausó con el aviso.
3. Todas las pruebas del sitio siguen pasando (704 de 704).

---

## 7. Lo que sigue (propuesta)

1. **Probarlo en teléfonos reales** (Android y iPhone) y en un aula con ruido, y ajustar los números de la sección 4 si hace falta.
2. **Órdenes en castellano:** «Jai, otra palabra», «Jai, repetí», «Jai, más lento». Aviso: en algunos teléfonos esa función manda la voz a servidores de Google.
3. **El paso grande, «Jai que escucha guaraní»:** que Jai diga si la pronunciación se parece a la del hablante. Para eso hacen falta muchas voces reales, revisadas por docentes especialistas y con permiso firmado de cada hablante para usarlas en ese entrenamiento.
