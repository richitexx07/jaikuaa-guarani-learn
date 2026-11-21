/**
 * Panel del administrador, parte de la tienda: pedidos impresos por enviar, reparto (lo que se le debe a cada
 * autor y embajador, con registro de pagos hechos) y el porcentaje de los embajadores.
 * El sistema no mueve dinero: solo anota lo que el administrador ya pagó por su cuenta.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HandCoins, Loader2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminTienda, cambiarEstadoPedido, guardarAjustesTienda, registrarLiquidacion, type PedidoAdmin, type SaldoConNombre } from "@/lib/tienda.functions";
import { ESTADO_PEDIDO_NOMBRE, type EstadoPedido } from "@/lib/obras";
import { formatoGs } from "@/lib/pagopar";

export function PanelTienda() {
  const cargar = useServerFn(adminTienda);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-tienda"], queryFn: () => cargar(), retry: false });
  const refrescar = () => void qc.invalidateQueries({ queryKey: ["admin-tienda"] });
  if (isLoading || !data) return null;
  return (
    <>
      <PedidosImpresos pedidos={data.pedidos} onCambio={refrescar} />
      <Reparto saldos={data.saldos} porcentaje={data.porcentajeAfiliado} onCambio={refrescar} />
    </>
  );
}

const SIGUIENTE: Partial<Record<EstadoPedido, { a: EstadoPedido; texto: string }>> = {
  por_enviar: { a: "enviado", texto: "Marcar enviado" },
  enviado: { a: "entregado", texto: "Marcar entregado" },
};

function PedidosImpresos({ pedidos, onCambio }: { pedidos: PedidoAdmin[]; onCambio: () => void }) {
  const cambiar = useServerFn(cambiarEstadoPedido);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const pendientes = pedidos.filter((p) => p.estado === "por_enviar" || p.estado === "enviado");
  const lista = verTodos ? pedidos : pendientes;

  async function mover(p: PedidoAdmin, a: EstadoPedido) {
    setOcupado(p.id);
    setAviso(null);
    try {
      await cambiar({ data: { id: p.id, estado: a } });
      onCambio();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo cambiar.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4" aria-labelledby="t-pedidos">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="t-pedidos" className="flex items-center gap-1.5 font-semibold text-foreground">
          <Package className="h-4 w-4" /> Pedidos impresos {pendientes.length > 0 && <span className="rounded-full bg-amber-100 px-2 text-xs font-bold text-amber-900">{pendientes.length} por atender</span>}
        </h2>
        {pedidos.length > pendientes.length && (
          <Button size="sm" variant="ghost" onClick={() => setVerTodos((v) => !v)}>
            {verTodos ? "Ver solo pendientes" : "Ver también entregados"}
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Aparecen cuando Pagopar confirma el pago. Coordiná la entrega por WhatsApp con el número que dejó.</p>
      {lista.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No hay pedidos por atender.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((p) => {
            const sig = SIGUIENTE[p.estado];
            const tel = p.telefono.replace(/\D/g, "").replace(/^0/, "595");
            return (
              <li key={p.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{p.titulo}</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {ESTADO_PEDIDO_NOMBRE[p.estado]}
                    {p.prueba ? " · prueba" : ""} · {formatoGs(p.montoGs)}
                  </span>
                </div>
                <p className="mt-1 text-foreground">
                  {p.nombre} ·{" "}
                  <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                    {p.telefono}
                  </a>
                </p>
                <p className="text-muted-foreground">
                  {p.direccion}, {p.ciudad}
                  {p.referencia ? ` (${p.referencia})` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(p.fecha).toLocaleString("es-PY", { dateStyle: "medium", timeStyle: "short" })}</p>
                {sig && (
                  <Button size="sm" className="mt-2" disabled={ocupado === p.id} onClick={() => void mover(p, sig.a)}>
                    {ocupado === p.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Truck className="mr-1.5 h-4 w-4" />} {sig.texto}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {aviso && <p className="mt-2 text-sm text-destructive" role="alert">{aviso}</p>}
    </section>
  );
}

function Reparto({ saldos, porcentaje, onCambio }: { saldos: SaldoConNombre[]; porcentaje: number; onCambio: () => void }) {
  const guardarAjustes = useServerFn(guardarAjustesTienda);
  const registrar = useServerFn(registrarLiquidacion);
  const [pct, setPct] = useState(String(porcentaje));
  const [pagando, setPagando] = useState<string | null>(null);
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function correr(fn: () => Promise<void>) {
    setOcupado(true);
    setAviso(null);
    try {
      await fn();
      onCambio();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Algo falló. Probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4" aria-labelledby="t-reparto">
      <h2 id="t-reparto" className="flex items-center gap-1.5 font-semibold text-foreground">
        <HandCoins className="h-4 w-4" /> Reparto con autores y embajadores
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sobre ventas cobradas de verdad (sin pruebas ni devoluciones). La parte del autor sale de su porcentaje de contrato; la del
        embajador sale de la parte de Jaikuaa. Cuando les pagues, anotalo acá: el sistema no mueve dinero.
      </p>

      <form
        className="mt-3 flex flex-wrap items-end gap-2 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(pct.replace(/\D/g, ""));
          void correr(async () => void (await guardarAjustes({ data: { porcentajeAfiliado: Math.min(50, n) } })));
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-foreground">% para embajadores (igual para todos)</span>
          <Input inputMode="numeric" value={pct} onChange={(e) => setPct(e.target.value)} className="h-10 w-28" aria-label="Porcentaje para embajadores" />
        </label>
        <Button type="submit" size="sm" variant="secondary" disabled={ocupado}>Guardar</Button>
        <span className="text-xs text-muted-foreground">Se aplica a las ventas nuevas. Máximo 50%.</span>
      </form>

      {saldos.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no hay ventas cobradas para repartir.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th scope="col" className="px-3 py-2">Persona</th>
                <th scope="col" className="px-3 py-2 text-right">Ventas</th>
                <th scope="col" className="px-3 py-2 text-right">Le corresponde</th>
                <th scope="col" className="px-3 py-2 text-right">Pagado</th>
                <th scope="col" className="px-3 py-2 text-right">Saldo</th>
                <th scope="col" className="px-3 py-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {saldos.map((x) => {
                const k = `${x.rol}|${x.id}`;
                return (
                  <tr key={k} className="align-top">
                    <td className="px-3 py-2">
                      <span className="font-medium text-foreground">{x.nombre || x.correo || "Sin nombre"}</span>
                      <span className="block text-xs text-muted-foreground">{x.rol === "autor" ? "Autor" : "Embajador"}</span>
                      {pagando === k && (
                        <form
                          className="mt-2 flex flex-col gap-1.5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const n = Number(monto.replace(/\D/g, ""));
                            if (!n) return;
                            void correr(async () => {
                              await registrar({ data: { beneficiarioId: x.id, rol: x.rol, montoGs: n, nota } });
                              setPagando(null);
                              setMonto("");
                              setNota("");
                            });
                          }}
                        >
                          <Input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto pagado (Gs.)" className="h-10" aria-label="Monto pagado" />
                          <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (ej. transferencia del 30/11)" maxLength={300} className="h-10" aria-label="Nota del pago" />
                          <div className="flex gap-1.5">
                            <Button type="submit" size="sm" disabled={ocupado || !monto.trim()}>Anotar pago</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setPagando(null)}>Cancelar</Button>
                          </div>
                        </form>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{x.ventas}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{formatoGs(x.devengadoGs)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{formatoGs(x.pagadoGs)}</td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right font-semibold ${x.saldoGs > 0 ? "text-amber-700" : "text-foreground"}`}>{formatoGs(x.saldoGs)}</td>
                    <td className="px-3 py-2">
                      {pagando !== k && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setPagando(k);
                          setMonto(x.saldoGs > 0 ? String(x.saldoGs) : "");
                        }}>
                          Anotar pago
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {aviso && <p className="mt-2 text-sm text-destructive" role="alert">{aviso}</p>}
    </section>
  );
}
