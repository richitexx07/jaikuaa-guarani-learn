import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pyDay(ts: string | Date): string {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/**
 * Cuaderno digital del docente: avance de los alumnos de su grupo.
 * Docente validador ve solo su propio grupo; admin puede elegir cualquiera.
 */
export const getTeacherNotebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ cohort: z.string().trim().max(60).nullable().default(null) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const [a, e] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
    ]);
    const isAdmin = a.data === true;
    const isEditor = e.data === true;
    if (!isAdmin && !isEditor) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let cohorts: string[] = [];
    let cohort: string | null = null;
    if (isAdmin) {
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("cohort")
        .not("cohort", "is", null);
      cohorts = [...new Set((rows ?? []).map((r) => r.cohort as string))].sort();
      cohort = data.cohort && cohorts.includes(data.cohort) ? data.cohort : (cohorts[0] ?? null);
    } else {
      const { data: me } = await supabaseAdmin
        .from("profiles")
        .select("cohort")
        .eq("id", context.userId)
        .maybeSingle();
      cohort = me?.cohort ?? null;
      cohorts = cohort ? [cohort] : [];
    }
    if (!cohort) return { isAdmin, cohorts, cohort: null, students: [], totalLessons: 0, hardWords: [], summary: null };

    const { data: staff } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "editor"]);
    const staffIds = new Set((staff ?? []).map((r) => r.user_id));

    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("cohort", cohort)
      .order("full_name");
    const students = (profs ?? []).filter((p) => !staffIds.has(p.id));
    const ids = students.map((s) => s.id);

    const { data: pubLessons } = await supabaseAdmin
      .from("lessons")
      .select("sort_order, title")
      .eq("status", "published")
      .order("sort_order");
    const lessonList = (pubLessons ?? []).map((l) => ({ n: l.sort_order as number, title: l.title as string }));
    const totalLessons = lessonList.length;

    if (ids.length === 0)
      return { isAdmin, cohorts, cohort, students: [], totalLessons, hardWords: [], summary: null };

    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [txRes, statsRes, ansRes] = await Promise.all([
      supabaseAdmin
        .from("xp_transactions")
        .select("user_id, amount, source, source_ref, created_at")
        .in("user_id", ids)
        .neq("source", "local-migration")
        .limit(20000),
      supabaseAdmin.from("user_stats").select("user_id, xp, current_streak").in("user_id", ids),
      supabaseAdmin
        .from("practice_answers" as never)
        .select("user_id, gn, correct")
        .in("user_id", ids)
        .gte("answered_at", since30)
        .limit(50000),
    ]);
    const answers = ((ansRes.data ?? []) as unknown as { user_id: string; gn: string; correct: boolean }[]);

    // Palabras que más le cuestan al grupo (últimos 30 días, con al menos 3 respuestas).
    const byWord = new Map<string, { attempts: number; wrong: number; students: Set<string> }>();
    for (const a of answers) {
      const w = byWord.get(a.gn) ?? { attempts: 0, wrong: 0, students: new Set<string>() };
      w.attempts++;
      if (!a.correct) {
        w.wrong++;
        w.students.add(a.user_id);
      }
      byWord.set(a.gn, w);
    }
    const hardWords = [...byWord.entries()]
      .filter(([, w]) => w.attempts >= 3 && w.wrong > 0)
      .map(([gn, w]) => ({
        gn,
        attempts: w.attempts,
        wrongPct: Math.round((w.wrong / w.attempts) * 100),
        students: w.students.size,
      }))
      .sort((a, b) => b.wrongPct - a.wrongPct || b.attempts - a.attempts)
      .slice(0, 8);
    const txs = txRes.data ?? [];
    const today = pyDay(new Date());
    const d7 = new Date(`${today}T12:00:00Z`);
    d7.setUTCDate(d7.getUTCDate() - 6);
    const since7 = d7.toISOString().slice(0, 10);

    const rows = students.map((s) => {
        const mine = txs.filter((t) => t.user_id === s.id);
        const week = mine.filter((t) => pyDay(t.created_at) >= since7);
        const doneRefs = new Set(
          mine.filter((t) => t.source === "lesson" && t.source_ref).map((t) => t.source_ref as string),
        );
        const lessonsDone = doneRefs.size;
        const next = lessonList.find((l) => !doneRefs.has(`guarani:${l.n}`)) ?? null;
        const myAns = answers.filter((a) => a.user_id === s.id);
        const wrongByWord = new Map<string, number>();
        for (const a of myAns) if (!a.correct) wrongByWord.set(a.gn, (wrongByWord.get(a.gn) ?? 0) + 1);
        const struggles = [...wrongByWord.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([gn, n]) => ({ gn, wrong: n }));
        const last = mine.reduce<string | null>(
          (m, t) => (!m || t.created_at > m ? t.created_at : m),
          null,
        );
        const st = statsRes.data?.find((x) => x.user_id === s.id);
        const status: "verde" | "amarillo" | "gris" =
          week.some((t) => t.source === "lesson") ? "verde" : week.length > 0 ? "amarillo" : "gris";
        return {
          id: s.id,
          name: s.full_name || (s.email ?? "").split("@")[0] || "Alumno",
          lessonsDone,
          weekXp: week.reduce((acc, t) => acc + t.amount, 0),
          weekActivities: week.length,
          totalXp: st?.xp ?? 0,
          streak: st?.current_streak ?? 0,
          lastActive: last ? pyDay(last) : null,
          status,
          nextLesson: next,
          answers30: myAns.length,
          accuracy30: myAns.length ? Math.round((myAns.filter((a) => a.correct).length / myAns.length) * 100) : null,
          struggles,
          // Entró en las últimas 2 semanas pero hace 7 días que no termina una lección: necesita una mano.
          needsHelp:
            !!next &&
            status !== "verde" &&
            !!last &&
            Date.now() - new Date(last).getTime() < 14 * 24 * 3600 * 1000,
        };
      });

    const correct30 = answers.filter((a) => a.correct).length;
    return {
      isAdmin,
      cohorts,
      cohort,
      totalLessons,
      students: rows,
      hardWords,
      summary: {
        students: rows.length,
        activeWeek: rows.filter((r) => r.status !== "gris").length,
        lessonsCompleted: rows.reduce((a, r) => a + r.lessonsDone, 0),
        finishedCourse: rows.filter((r) => totalLessons > 0 && r.lessonsDone >= totalLessons).length,
        answers30: answers.length,
        accuracy30: answers.length ? Math.round((correct30 / answers.length) * 100) : null,
        generatedAt: new Date().toISOString(),
      },
    };
  });
