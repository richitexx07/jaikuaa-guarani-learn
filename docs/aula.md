# Aula para docentes

- **Alumno** (`/aula`): entra con el código de 6 letras de su docente (o con el enlace `jaikuaa.com/aula?codigo=XXXXXX`), ve las tareas, si las hizo y la fecha límite. Puede salir del aula cuando quiera. En el panel aparece «Tenés N tareas de tu aula».
- **Docente** (`/aula/docente`): pide acceso una vez (institución y qué enseña); el administrador lo habilita en esa misma pantalla. Los admin y docentes validadores ya están habilitados. Crea aulas, cada una con su código.
- **Aula** (`/aula/$id`): invitar por WhatsApp o copiar el enlace; asignar lecciones publicadas o juegos con fecha límite e indicación; tabla de avance (hecha, pendiente, vencida) y última actividad; quitar alumnos; cerrar el aula.
- **Constancia** (`/aula/constancia/$aulaId/$alumnoId`): constancia de participación para imprimir o guardar en PDF, con las tareas completadas y la firma del docente. No es un certificado oficial.

Cómo se cuenta una tarea: la lección vale si el alumno la terminó alguna vez; el juego, si lo jugó después de que se asignó.

Tablas `aula_docentes`, `aulas`, `aula_miembros`, `aula_tareas` (migración `20261026120000_aula.sql`), aplicadas en Lovable Cloud el 26/10/2026.
