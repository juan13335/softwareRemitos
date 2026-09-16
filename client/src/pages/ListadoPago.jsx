import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, Receipt, User, Loader2 } from "lucide-react";
import api  from "../api/api.js"; // Ajustá la ruta a tu cliente axios

function formatoMoneda(valor) {
  const num = Number(valor) || 0;
  return (num < 0 ? "-$ " : "$ ") + Math.round(Math.abs(num)).toLocaleString("es-AR");
}

function formatoFecha(fechaIso) {
  if (!fechaIso) return "—";
  const [y, m, d] = fechaIso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

export default function ListadoPagos() {
  const [socios, setSocios] = useState([]);
  const [pagosData, setPagosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [socioId, setSocioId] = useState("todos");
  const [expandidos, setExpandidos] = useState(new Set());

  // Cargar socios y pagos en paralelo al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        const [resSocios, resPagos] = await Promise.all([
          api.get("/socios"),
          api.get("/pagos"),
        ]);

        setSocios(resSocios.data || []);
        setPagosData(resPagos.data || []);
      } catch (err) {
        console.error("Error al cargar listado de pagos:", err);
        setError("Ocurrió un error al cargar los pagos registrados.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  // Filtrado por socio
  const pagos = useMemo(
    () => (socioId === "todos" ? pagosData : pagosData.filter((p) => p.socioId === socioId)),
    [socioId, pagosData]
  );

  const totalPeriodo = useMemo(() => pagos.reduce((acc, p) => acc + p.monto, 0), [pagos]);

  function toggleExpandido(id) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center gap-3 px-5 py-8 text-stone-500">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      <span className="text-sm font-medium">Cargando pagos...</span>
    </main>
  );
}

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-9 text-stone-800">
      <div className="mb-2 text-sm text-stone-500">
        Pagos / <span className="font-semibold text-stone-800">Listado</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Pagos registrados</h1>
          <div className="mt-1 text-sm text-stone-500">
            Historial de transferencias y cancelación de remitos
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-sm text-stone-500">
            <User size={14} /> Socio
          </span>
          <select
            value={socioId}
            onChange={(e) => setSocioId(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-800 focus:outline-2 focus:outline-amber-500"
          >
            <option value="todos">Todos los socios</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 border border-emerald-200/60">
        <Receipt size={16} className="shrink-0 text-emerald-700" />
        <div>
          Total {socioId === "todos" ? "pagado" : "pagado a este socio"}:{" "}
          <b className="font-semibold">{formatoMoneda(totalPeriodo)}</b>
          {" · "}
          {pagos.length} pago{pagos.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {pagos.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-stone-500">
            No hay pagos registrados{socioId !== "todos" ? " para este socio" : ""} todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="w-9 px-3 py-3"></th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500">Socio</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500">Formas de pago</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500">Remitos</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-stone-500">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => {
                  const abierto = expandidos.has(pago.id);
                  return (
                    <FilaPago
                      key={pago.id}
                      pago={pago}
                      abierto={abierto}
                      onToggle={() => toggleExpandido(pago.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function FilaPago({ pago, abierto, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={
          "cursor-pointer border-b border-stone-200 transition-colors " +
          (abierto ? "bg-amber-50/50" : "odd:bg-white even:bg-stone-50/50 hover:bg-stone-100/80")
        }
      >
        <td className="px-3 py-3.5 text-stone-400">
          {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 text-stone-600">
          {formatoFecha(pago.fecha_pago)}
        </td>
        <td className="px-3 py-3.5 font-semibold text-stone-800">{pago.socio}</td>
        <td className="px-3 py-3.5">
          <div className="flex flex-col gap-1">
            {pago.metodos.map((m, i) => {
              const esSaldoAFavor = m.forma.toLowerCase() === "saldo a favor";
              return (
                <div key={i} className="flex items-baseline gap-1.5 text-xs sm:text-sm">
                  <span
                    className={`capitalize ${
                      esSaldoAFavor ? "font-medium text-sky-700" : "text-stone-700"
                    }`}
                  >
                    {m.forma}
                  </span>
                  <span className="flex-1 border-b border-dotted border-stone-300 translate-y-[-2px]" />
                  <span
                    className={`font-semibold ${
                      esSaldoAFavor ? "text-sky-800" : "text-stone-800"
                    }`}
                  >
                    {formatoMoneda(m.monto)}
                  </span>
                </div>
              );
            })}
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 text-stone-500">
          {pago.remitos.length} remito{pago.remitos.length !== 1 ? "s" : ""}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 text-right text-base font-bold text-stone-800">
          {formatoMoneda(pago.monto)}
        </td>
      </tr>

      {abierto && (
        <tr className="border-b border-stone-200 bg-stone-50">
          <td colSpan={6} className="px-3 py-4 sm:pl-14 sm:pr-5">
            {(pago.nro_comprobante || pago.notas) && (
              <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-500">
                {pago.nro_comprobante && (
                  <span>
                    N° de comprobante:{" "}
                    <span className="font-medium text-stone-700">{pago.nro_comprobante}</span>
                  </span>
                )}
                {pago.notas && (
                  <span>
                    Notas: <span className="text-stone-700">{pago.notas}</span>
                  </span>
                )}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/70">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-stone-500">
                      N° remito
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-stone-500">
                      Monto imputado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pago.remitos.map((r) => (
                    <tr key={r.remito_id} className="border-b border-stone-100 last:border-b-0">
                      <td className="px-3 py-2.5 font-medium text-stone-800">{r.nro_remito}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-stone-800">
                        {formatoMoneda(r.monto_imputado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}