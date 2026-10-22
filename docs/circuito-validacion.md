# Circuito de validación en tres niveles

**Rama:** `circuito-validacion` (todavía no está en `main`).

## Cómo funciona
1. **Propone:** solo personas habilitadas del piloto (estudiante en práctica aprobado, docente validador o admin). El servidor rechaza a cualquier otra cuenta. Puede proponer una palabra nueva o la corrección de una palabra del corpus. Tiene un tope de 20 propuestas por día. «Señalar un error» sigue abierto para todos porque solo avisa y no carga contenido.
2. **Revisa:** un revisor avanzado (estudiante avanzado o pasante), un docente validador o un admin. Puede aprobar, devolver o no aceptar. Para devolver o no aceptar tiene que escribir el motivo.
3. **Valida:** un docente validador (rol `editor`) o un admin. Solo en este paso el contenido entra al corpus, publicado y con `validated_by` y `validated_at` de quien validó.

- Son tres personas distintas: nadie revisa ni valida lo que propuso o revisó. La base de datos también lo exige.
- Cada paso guarda quién y cuándo, y además queda un historial completo en `content_proposals.history`.
- Una propuesta devuelta vuelve a quien la propuso. Esa persona la corrige y la reenvía, y el circuito empieza de nuevo.
- Si una corrección cambia la escritura de una palabra, la palabra queda sin audio, porque el audio grabado corresponde a la forma anterior. Hay que volver a grabarlo.
- Ni la IA ni el equipo técnico escriben guaraní. El formulario le pide a la persona que no copie de traductores automáticos.

## Pantallas
- `/validacion`, con las pestañas Proponer, Mis propuestas, Revisar, Validar y Revisores. Cada pestaña aparece según el rol de quien entra.
- Enlace desde `/admin/corpus`.

## Cómo encenderlo
1. Aplicar `supabase/migrations/20261018120000_circuito_validacion.sql` en la base de Lovable Cloud. Crea `content_reviewers` y `content_proposals`, con RLS.
2. Regenerar los tipos de Supabase. Lovable lo hace solo al aplicar la migración.
3. Fusionar la rama `circuito-validacion` en `main` y publicar.

Hasta que se aplique la migración, la rama no debe ir a `main`: la página fallaría porque las tablas todavía no existen.
