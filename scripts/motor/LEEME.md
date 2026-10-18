# Cobertura del motor sobre el corpus de Jaikuaa

Prueba cuántas palabras y frases del corpus publicado de la plataforma reconoce el motor JAIKUAA V3.
Usa el mismo endpoint que Studio: `POST <motor>/analyze` con `{ "text": "..." }` y el encabezado `X-API-Key`.
El script no escribe ni corrige guaraní: solo consulta y cuenta.

## Uso (Alan, en la computadora donde corre el motor)

Requiere Node 18 o más nuevo; no hay que instalar nada.

```bash
cd scripts/motor
node motor-cobertura.mjs --url http://localhost:8000
```

Si el motor corre en otra dirección o con otra clave:

```bash
node motor-cobertura.mjs --url https://<motor> --key <X-API-Key>
```

Muestra en pantalla cuántas entradas quedaron reconocidas, parciales o no reconocidas, y el tiempo medio por consulta.
Deja el detalle palabra por palabra en `cobertura_motor_<fecha>.csv`.

Una entrada cuenta como reconocida cuando todos sus tokens vuelven con `analysis_status: "known"`.

## El archivo de palabras

`corpus_publicado_jaikuaa_2026-10-17.csv` tiene las 109 palabras y frases publicadas en jaikuaa.com, todas con audio humano.
**Ninguna figura todavía como validada por un docente en el sistema** (`validated_by` vacío).
Sirven para medir la cobertura del motor. No son reglas ni datos de entrenamiento:
las reglas del motor las definen y validan los especialistas (Comité Lingüístico, "ficha de regla").
