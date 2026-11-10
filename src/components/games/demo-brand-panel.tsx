import { useEffect, useState } from "react";
import { Presentation, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setDemoBrands, useDemoBrands, type DemoBrand } from "@/lib/demo-brand";
import { MAX_MARCAS, SEGUNDOS_POR_MARCA } from "@/lib/valla-led";

const vacias = (): DemoBrand[] => Array.from({ length: MAX_MARCAS }, () => ({ name: "", slogan: "" }));

/** Botón "Demo de marcas" (solo administradores). Hasta 5 marcas que rotan en la valla, solo en esta pestaña. */
export function DemoBrandPanel() {
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const marcas = useDemoBrands();
  const [filas, setFilas] = useState<DemoBrand[]>(vacias);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { data: ok } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (alive) setAdmin(!!ok);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (open) setFilas(vacias().map((v, i) => marcas[i] ?? v));
  }, [open, marcas]);

  if (!admin) return null;
  const cambiar = (i: number, k: keyof DemoBrand, v: string) => setFilas((f) => f.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {marcas.length ? <>Demostración activa: <span className="text-primary">{marcas.map((m) => m.name).join(" · ")}</span></> : "Demo de marcas (solo vos lo ves)"}
        </p>
        <div className="flex gap-2">
          {marcas.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setDemoBrands([])}>
              <X className="h-4 w-4" /> Quitar
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Presentation className="h-4 w-4" /> {open ? "Cerrar" : "Demo de marcas"}
          </Button>
        </div>
      </div>
      {open && (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setDemoBrands(filas);
            setOpen(false);
          }}
        >
          {filas.map((f, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <Input aria-label={`Marca ${i + 1}`} placeholder={`Marca ${i + 1}`} maxLength={40} value={f.name} onChange={(e) => cambiar(i, "name", e.target.value)} autoFocus={i === 0} />
              <Input aria-label={`Frase de la marca ${i + 1} (opcional)`} placeholder="Frase (opcional)" maxLength={60} value={f.slogan} onChange={(e) => cambiar(i, "slogan", e.target.value)} />
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={!filas.some((f) => f.name.trim())}>Mostrar en el estadio</Button>
          <p className="text-xs text-muted-foreground">Cada marca se muestra {SEGUNDOS_POR_MARCA} segundos en la valla y después rota. Solo cambia en esta pantalla; nadie más lo ve y se borra al cerrar la pestaña.</p>
        </form>
      )}
    </div>
  );
}
