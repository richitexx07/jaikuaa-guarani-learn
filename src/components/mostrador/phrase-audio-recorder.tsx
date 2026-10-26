import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, Play, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toMp3Base64, fileToBase64 } from "@/lib/mp3-encode";

const MAX_SECONDS = 20;

/**
 * Grabar o subir la voz humana de una frase del Modo mostrador (admin y docente validador).
 * Misma mecánica que la grabadora del corpus: se escucha antes de guardar y se convierte a MP3.
 */
export function PhraseAudioRecorder({
  label,
  hasAudio,
  onUpload,
  onSaved,
}: {
  label: string;
  hasAudio: boolean;
  onUpload: (base64: string) => Promise<unknown>;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isMp3File, setIsMp3File] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => cleanup(), []);
  useEffect(() => {
    if (!blob) return setPreviewUrl(null);
    const u = URL.createObjectURL(blob);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        cleanup();
        setRecording(false);
        setIsMp3File(false);
        setBlob(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recRef.current = rec;
      setBlob(null);
      setSeconds(0);
      rec.start();
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) rec.state === "recording" && rec.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("No se pudo usar el micrófono. Revisá los permisos del navegador.");
    }
  }

  function stop() {
    if (recRef.current?.state === "recording") recRef.current.stop();
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("El archivo es muy grande (máx. 5 MB).");
    const mp3 = f.type === "audio/mpeg" || /\.mp3$/i.test(f.name);
    setIsMp3File(mp3 && f.size <= 2 * 1024 * 1024);
    setBlob(f);
  }

  async function save() {
    if (!blob) return;
    setSaving(true);
    try {
      const base64 = isMp3File ? await fileToBase64(blob) : await toMp3Base64(blob);
      await onUpload(base64);
      toast.success("Grabación guardada. Falta que otro docente la valide.");
      setBlob(null);
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo guardar el audio.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        size="default"
        variant={hasAudio ? "outline" : "cta"}
        onClick={() => setOpen(true)}
        aria-label={hasAudio ? `Reemplazar la grabación de «${label}»` : `Grabar la voz de «${label}»`}
        className="h-11 w-full justify-center px-4 text-sm font-semibold sm:w-auto"
      >
        <Mic className="h-4 w-4" />
        {hasAudio ? "Reemplazar grabación" : "Grabar voz"}
      </Button>
    );
  }


  return (
    <div className="w-full basis-full rounded-md border bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Grabá la frase con voz natural, sin ruido de fondo
          {hasAudio && " (reemplaza la grabación actual)"}
        </span>
        <Button size="icon" variant="ghost" onClick={() => { stop(); setBlob(null); setOpen(false); }} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <Button
            size="default"
            variant="destructive"
            onClick={stop}
            className="h-11 w-full justify-center sm:w-auto"
          >
            <Square className="h-4 w-4" /> Detener ({seconds}s / {MAX_SECONDS}s)
          </Button>
        ) : (
          <Button
            size="default"
            onClick={start}
            disabled={saving}
            className="h-11 w-full justify-center sm:w-auto"
          >
            <Mic className="h-4 w-4" /> {blob ? "Grabar de nuevo" : "Grabar"}
          </Button>
        )}
        <Button
          size="default"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={recording || saving}
          className="h-11 w-full justify-center sm:w-auto"
        >
          <Upload className="h-4 w-4" /> Subir archivo
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {previewUrl && !recording && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Play className="h-3 w-3" /> Escuchá antes de guardar:
          </div>
          <audio src={previewUrl} controls className="h-10 w-full" />
          <Button
            size="default"
            onClick={save}
            disabled={saving}
            className="h-11 w-full justify-center sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar audio
          </Button>

        </div>
      )}
    </div>
  );
}
