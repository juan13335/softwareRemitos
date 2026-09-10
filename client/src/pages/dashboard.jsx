import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, Package, CreditCard, Plus, Check, Clock, Calendar, Loader2 } from "lucide-react";
import EstadoRemito from "../components/EstadoRemito.jsx";
import { api } from "../api/api.js";

const KPIS = [
  { label: "Total pendiente a pagar", value: "$ 545.000", delta: "a 1 socio", icon: Clock, tint: "bg-amber-50 text-amber-700" },
  { label: "Total transferido", value: "$ 655.000", delta: "este año", icon: Check, tint: "bg-emerald-50 text-emerald-700" },
  { label: "Remitos cargados", value: "3", delta: "2 cobrados · 1 pendiente", icon: Package, tint: "bg-sky-50 text-sky-700" },
  { label: "Socios activos", value: "1", delta: "sin cambios", icon: Users, tint: "bg-stone-100 text-stone-500" },
];

const QUICK_ACTIONS = [
  { label: "Cargar nuevo remito", icon: Plus, path: "/remitos/nuevo"},
  { label: "Registrar pago", icon: CreditCard },
  { label: "Agregar socio", icon: Users },
];

export default function Dashboard() {
  const [remitos, setRemitos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRemitos = async () => {
      try {
        const res = await api.get("/remitos");
        setRemitos(res.data);
      } catch (err) {
        console.error("Error al cargar remitos:", err);
        setError("No se pudieron cargar los comprobantes.");
      } finally {
        setCargando(false);
      }
    };

    fetchRemitos();
  }, []);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Alternar seleccionar todos
  const todosSeleccionados =
    remitos.length > 0 && seleccionados.length === remitos.length;

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados([]);
    } else {
      setSeleccionados(remitos.map((r) => r.id || r.nro_remito));
    }
  };

  // Suma total acumulada de lo que esté tildado
  const totalSeleccionado = remitos
    .filter((r) => seleccionados.includes(r.id || r.nro_remito))
    .reduce((acc, r) => acc + (Number(r.total) || 0), 0);

  const formatMoneda = (val) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val || 0);

  const formatFecha = (str) => {
    if (!str) return "—";
    const [y, m, d] = str.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resumen general</h1>
          <div className="mt-1 text-sm text-stone-500">Estado de cuentas con todos los socios</div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-500">
          <Calendar size={15} />
          Hoy, 09 de septiembre 2026
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map(({ label, value, delta, icon: Icon, tint }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className={`mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
              <Icon size={18} />
            </div>
            <div className="mb-1.5 text-sm text-stone-500">{label}</div>
            <div className="text-2xl font-bold text-stone-900">{value}</div>
            <div className="mt-1.5 text-xs text-stone-500">{delta}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
          <div className="mb-7 flex flex-col gap-3 sm:flex-row">
              {QUICK_ACTIONS.map(({ label, icon: Icon, path }) => (
                  <button
                      key={label}
                      onClick={() => path && navigate(path)}
                      className="flex flex-1 items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left text-sm font-semibold text-stone-800 hover:border-amber-400 hover:bg-amber-50/40 transition-colors cursor-pointer"
                  >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                          <Icon size={17} />
                      </span>
                      {label}
                  </button>
              ))}
          </div>

      {/* Tabla de remitos con selección múltiple */}
<div className="rounded-xl border border-stone-200 bg-white p-6 relative">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-base font-bold text-stone-900">Últimos remitos</h2>
      {seleccionados.length > 0 && (
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1 inline-block">
          {seleccionados.length} seleccionados · Total: {formatMoneda(totalSeleccionado)}
        </span>
      )}
    </div>
    <span className="cursor-pointer text-sm font-medium text-sky-700">Ver todos →</span>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full min-w-[620px] border-collapse text-sm">
      <thead>
        <tr>
          {/* Checkbox Maestro */}
          <th className="border-b border-stone-200 pb-2.5 pl-2 text-left w-10">
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={toggleTodos}
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
          </th>
          {["Fecha", "Socio", "N° remito", "N° factura", "Total", "Estado"].map((h) => (
            <th key={h} className="border-b border-stone-200 pb-2.5 text-left text-xs font-semibold text-stone-500">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cargando ? (
          <tr>
            <td colSpan={7} className="py-8 text-center text-stone-500">
              Cargando comprobantes...
            </td>
          </tr>
        ) : remitos.length === 0 ? (
          <tr>
            <td colSpan={7} className="py-8 text-center text-stone-400">
              No hay remitos registrados.
            </td>
          </tr>
        ) : (
          remitos.map((r) => {
            const id = r.id || r.nro_remito;
            const estaSeleccionado = seleccionados.includes(id);

            return (
              <tr
                key={id}
                className={`transition-colors ${
                  estaSeleccionado ? "bg-amber-50/50" : "hover:bg-stone-50/60"
                }`}
              >
                <td className="border-b border-stone-100 py-3.5 pl-2">
                  <input
                    type="checkbox"
                    checked={estaSeleccionado}
                    onChange={() => toggleSeleccion(id)}
                    className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </td>
                <td className="border-b border-stone-100 py-3.5">{formatFecha(r.fecha)}</td>
                <td className="border-b border-stone-100 py-3.5 font-semibold text-stone-800">{r.socio?.nombre || "—"}</td>
                <td className="border-b border-stone-100 py-3.5 font-medium">{r.nro_remito}</td>
                <td className="border-b border-stone-100 py-3.5 text-stone-500">{r.nro_factura || "—"}</td>
                <td className="border-b border-stone-100 py-3.5 font-bold">{formatMoneda(r.total)}</td>
                <td className="border-b border-stone-100 py-3.5">
                  <EstadoRemito estado={r.estado_cobro_socio ? "cobrado" : "pendiente"} />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>

  {/* Barra flotante de pago cuando hay remitos marcados */}
  {seleccionados.length > 0 && (
    <div className="sticky bottom-4 mt-4 flex items-center justify-between rounded-xl bg-stone-900 px-5 py-3.5 text-white shadow-xl">
      <div className="text-sm">
        <span className="font-semibold text-amber-400">{seleccionados.length}</span> comprobantes seleccionados por un total de{" "}
        <span className="font-bold text-emerald-400">{formatMoneda(totalSeleccionado)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setSeleccionados([])}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-white"
        >
          Desmarcar
        </button>
        <button
          onClick={() => console.log("IDs a pagar:", seleccionados)}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
        >
          Pagar seleccionados
        </button>
      </div>
    </div>
  )}
</div>
    </main>
  );
}