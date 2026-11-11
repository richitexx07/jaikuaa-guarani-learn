import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WordAudioRecorder } from "@/components/corpus/word-audio-recorder";
import { listCorpusWords, updateCorpusWord } from "@/lib/corpus.functions";
import { GateNotice, useDeterministicGate } from "@/components/corpus/gate-notice";

/** Bandeja del docente validador: palabras en borrador para aprobar en un toque. */
export function ValidationPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCorpusWords);
  const updateFn = useServerFn(updateCorpusWord);
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["validation-queue", search],
    queryFn: () => listFn({ data: { search, onlyPendingValidation: true, limit: 200 } }),
  });
  const words = (q.data?.words ?? []).filter((w) => w.status === "draft");

  const approve = useMutation({
    mutationFn: (id: string) => updateFn({ data: { id, status: "published" } }),
    onSuccess: () => {
      toast.success("Palabra validada y publicada.");
      void qc.invalidateQueries({ queryKey: ["validation-queue"] });
      void qc.invalidateQueries({ queryKey: ["corpus-words"] });
      void qc.invalidateQueries({ queryKey: ["corpus-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo validar la palabra."),
  });

  const withoutAudio = words.filter((w) => !w.has_audio).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h2 className="font-display text-xl font-bold text-foreground">Bandeja de validación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá cada palabra en borrador. Al aprobarla queda publicada y se registra quién la
          validó y cuándo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">{words.length} pendientes</Badge>
          {withoutAudio > 0 && (
            <Badge variant="destructive">{withoutAudio} sin audio</Badge>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 pl-9"
          placeholder="Buscar palabra o traducción"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : words.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-primary" />
          No hay palabras pendientes de validación.
        </div>
      ) : (
        <ul className="space-y-3">
          {words.map((w) => (
            <li key={w.id} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg font-bold text-foreground">{w.gn}</span>
                <span className="text-muted-foreground">{w.es}</span>
                {w.category && <Badge variant="outline">{w.category}</Badge>}
              </div>
              {w.notes && <p className="mt-1 text-sm text-muted-foreground">{w.notes}</p>}
              {!w.has_audio && (
                <p className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Esta palabra todavía no tiene audio. Podés grabarlo antes de aprobarla.
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
                <WordAudioRecorder
                  wordId={w.id}
                  slug={w.audio_slug}
                  hasAudio={w.has_audio}
                  onSaved={() => void qc.invalidateQueries({ queryKey: ["validation-queue"] })}
                />
                <GatedApprove gn={w.gn} disabled={approve.isPending} onApprove={() => approve.mutate(w.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GatedApprove({ gn, disabled, onApprove }: { gn: string; disabled: boolean; onApprove: () => void }) {
  const gate = useDeterministicGate(gn);
  return (
    <div className="w-full sm:w-auto">
      <Button variant="cta" className="h-11 w-full sm:w-auto" disabled={disabled} onClick={onApprove}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Aprobar y publicar
      </Button>
      <GateNotice accepted={gate.accepted} reason={gate.reason} loading={gate.loading} fuente={gate.fuente} />
    </div>
  );
}
