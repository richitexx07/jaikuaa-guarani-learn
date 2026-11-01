import { createFileRoute } from "@tanstack/react-router";
import { buildReminderIcs } from "@/lib/reminder-ics";

/** /api/recordatorio?h=20&m=0 → archivo de calendario con el recordatorio diario (lo abre el celular). */
export const Route = createFileRoute("/api/recordatorio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const ics = buildReminderIcs(Number(u.searchParams.get("h") ?? 20), Number(u.searchParams.get("m") ?? 0));
        return new Response(ics, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="jaikuaa-recordatorio.ics"',
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
