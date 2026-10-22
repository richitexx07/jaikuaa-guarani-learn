import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Vocabulario para el Laboratorio Morfológico (solo admin).
 * Devuelve las palabras PUBLICADAS y marca como validadas solo las que validó un docente
 * validador (rol "editor"). No devuelve nombres ni datos de personas.
 */
export const getLabCorpus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: words, error } = await supabaseAdmin
      .from("corpus_words")
      .select("gn, validated_by")
      .eq("status", "published")
      .limit(5000);
    if (error) throw new Error(error.message);

    const validatorIds = [...new Set((words ?? []).map((w) => w.validated_by).filter(Boolean))] as string[];
    const editors = new Set<string>();
    if (validatorIds.length > 0) {
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "editor")
        .in("user_id", validatorIds);
      if (rolesError) throw new Error(rolesError.message);
      for (const r of roles ?? []) editors.add(r.user_id);
    }

    return {
      entries: (words ?? []).map((w) => ({ gn: w.gn, validated: !!w.validated_by && editors.has(w.validated_by) })),
    };
  });

/**
 * Formas que imprime la Gramática ALG 2020, con sus páginas, y los 110 pares de calcos del
 * capítulo 6 (solo admin, uso interno).
 * Sirve para saber si una raíz está atestiguada por la fuente oficial y para mostrar formas
 * parecidas. El archivo vive solo en el servidor: no se envía a alumnos ni se publica.
 */
export const getLabBook = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");
    const mod = (await import("@/lib/morph/data/gramatica-alg-2020-formas.json")) as unknown as {
      default: { forms: Record<string, number[]>; observaciones: Record<string, { pages: number[]; issues: string[] }> };
    };
    const calcos = (await import("@/lib/morph/data/gramatica-alg-2020-calcos.json")) as unknown as {
      default: { pares: { n: number; calco: string; correcta: string[]; paginas: [number, number] }[] };
    };
    return { forms: mod.default.forms, observaciones: mod.default.observaciones, calcos: calcos.default.pares };
  });

/**
 * Significados del Wikcionario (Wiktionary en inglés, vía kaikki.org), licencia CC BY-SA 4.0 /
 * GFDL (solo admin). Fuente colaborativa externa, no validada: el Laboratorio la muestra aparte
 * de la Gramática ALG 2020 y siempre con su atribución.
 */
export const getLabWiktionary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");
    const mod = (await import("@/lib/morph/data/wikcionario-gn.json")) as unknown as {
      default: { fuente: string; url: string; atribucion: string; licencia: string; fecha_de_descarga: string; entradas: [string, string, string[]][] };
    };
    const { entradas, ...source } = mod.default;
    return { source, entries: entradas };
  });

/**
 * Lecturas del motor HFST/LEXC de Alan (contrato 1.0, docs/motor/contrato-motores.md), solo admin.
 * Queda apagado hasta que existan los secretos ALAN_MOTOR_URL y ALAN_MOTOR_TOKEN en el servidor.
 * La clave nunca sale del servidor. Si el servicio tarda o responde con otra forma, se informa y el
 * Laboratorio sigue con sus propias lecturas.
 */
export const getAlanMotorReadings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().trim().min(1).max(300) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");
    // Misma llamada que usa la barrera de aprobación: rechaza !res.ok antes de leer el cuerpo.
    const { callAlanMotor } = await import("@/lib/deterministic-gate.server");
    return callAlanMotor(data.text);
  });

/**
 * Entradas del diccionario monolingüe de la Academia de la Lengua Guaraní que publica la SPL
 * (solo admin, uso interno). Solo entrada, abreviatura y enlace: las definiciones se leen en el
 * sitio de la SPL.
 */
export const getLabDictionary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");
    const mod = (await import("@/lib/morph/data/spl-diccionario-alg.json")) as unknown as {
      default: { fuente: string; url: string; autoria: string; publica: string; fecha_de_consulta: string; uso: string; entradas: [string, string, string, number, string[]?][] };
    };
    const { entradas, ...source } = mod.default;
    return { source, entries: entradas };
  });
