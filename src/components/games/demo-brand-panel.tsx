import { useEffect, useState } from "react";
import { Presentation, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setDemoBrand, useDemoBrand } from "@/lib/demo-brand";

/** Botón "Demo de marca" (solo administradores). Cambia la valla solo en esta pestaña. */
export function DemoBrandPanel() {
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const brand = useDemoBrand();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");

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
    if (open) {
      setName(brand?.name ?? "");
      setSlogan(brand?.slogan ?? "");
    }
  }, [open, brand]);

  if (!admin) return null;

  return (
    <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {brand ? <>Demostración activa: <span className="text-primary">{brand.name}</span></> : "Demo de marca (solo vos lo ves)"}
        </p>
        <div className="flex gap-2">
          {brand && (
            <Button size="sm" variant="outline" onClick={() => setDemoBrand(null)}>
              <X className="h-4 w-4" /> Quitar
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Presentation className="h-4 w-4" /> {open ? "Cerrar" : "Demo de marca"}
          </Button>
        </div>
      </div>
      {open && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            setDemoBrand({ name, slogan });
            setOpen(false);
          }}
        >
          <Input aria-label="Nombre de la empresa" placeholder="Nombre de la empresa" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Input aria-label="Frase para la valla (opcional)" placeholder="Frase para la valla (opcional)" maxLength={60} value={slogan} onChange={(e) => setSlogan(e.target.value)} />
          <Button type="submit" className="w-full" disabled={!name.trim()}>Mostrar en el estadio</Button>
          <p className="text-xs text-muted-foreground">Solo cambia en esta pantalla. Nadie más lo ve y se borra al cerrar la pestaña.</p>
        </form>
      )}
    </div>
  );
}
