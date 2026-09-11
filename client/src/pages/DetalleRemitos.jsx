import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Check, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import EstadoRemito from "../components/EstadoRemito.jsx";
import { api } from "../api/api";

function formatoMoneda(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function formatoFecha(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

export default function DetalleRemito() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [remito, setRemito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await api.get(`/remitos/${id}`);
        setRemito(res.data);
      } catch (err) {
        console.error("Error al cargar detalle del remito:", err);
        setError("No se encontró el comprobante o falló la conexión.");
      } finally {
        setCargando(false);
      }
    };

    fetchDetalle();
  }, [id]);

  async function handleEliminar() {
    if (!window.confirm("¿Seguro que querés eliminar este remito y todos sus ítems?")) return;

    setEliminando(true);
    try {
      await api.delete(`/remitos/${id}`);
      navigate("/");
    } catch (err) {
      console.error("Error al eliminar remito:", err);
      alert(err.response?.data?.error || "Error al intentar borrar el comprobante.");
      setEliminando(false);
    }
  }

  if (cargando) {
    return (
      <main className="mx-auto flex w-full max-w-3xl items-center justify-center py-24 text-stone-500">
        <Loader2 className="animate-spin text-amber-500 mr-2" size={20} />
        Cargando comprobante...
      </main>
    );
  }

  if (error || !remito) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-8 md:px-9">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold">{error || "Remito no encontrado."}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-700 border border-stone-200 hover:bg-stone-50"
          >
            <ArrowLeft size={16} /> Volver al dashboard
          </button>
        </div>
      </main>
    );
  }

  const items = remito.items || [];
  const total = items.reduce(
    (acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
    0
  );
  const esCobrado = Boolean(remito.nro_factura);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 md:px-9">
      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} />
        Remitos / <span className="font-semibold text-stone-800">{remito.nro_remito}</span>
      </button>

      {/* Encabezado y acciones */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900">Remito {remito.nro_remito}</h1>
            <EstadoRemito estado={esCobrado ? "cobrado" : "pendiente"} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <User size={14} /> Socio: {remito.socio?.nombre || "—"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/remitos/editar/${remito.id}`)}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Pencil size={15} />
            Editar
          </button>
          <button
            disabled={eliminando}
            onClick={handleEliminar}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>

      {/* Datos del remito */}
      <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Datos del comprobante</h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-4 sm:grid-cols-4">
          <div>
            <div className="text-sm text-stone-500">Fecha</div>
            <div className="mt-0.5 font-semibold text-stone-800">{formatoFecha(remito.fecha)}</div>
          </div>
          <div>
            <div className="text-sm text-stone-500">N° de remito</div>
            <div className="mt-0.5 font-semibold text-stone-800">{remito.nro_remito}</div>
          </div>
          <div>
            <div className="text-sm text-stone-500">N° de factura</div>
            <div className="mt-0.5 font-semibold text-stone-800">
              {remito.nro_factura || <span className="italic text-stone-400">Sin factura</span>}
            </div>
          </div>
          <div>
            <div className="text-sm text-stone-500">Estado</div>
            <div className="mt-0.5">
              <EstadoRemito estado={esCobrado ? "cobrado" : "pendiente"} />
            </div>
          </div>
        </div>
      </section>

      {/* Productos entregados */}
      <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Productos entregados</h2>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Producto", "Cantidad", "Precio unit.", "Subtotal"].map((h) => (
                <th
                  key={h}
                  className="border-b border-stone-200 pb-2.5 text-left text-xs font-semibold text-stone-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const subtotal = (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0);
              return (
                <tr key={it.id || idx}>
                  <td className="border-b border-stone-100 py-3.5 font-medium text-stone-800 last:border-b-0">
                    {it.producto?.nombre || it.producto_nombre || "Producto"}
                  </td>
                  <td className="border-b border-stone-100 py-3.5 last:border-b-0">{it.cantidad}</td>
                  <td className="border-b border-stone-100 py-3.5 last:border-b-0">
                    {formatoMoneda(it.precio_unitario)}
                  </td>
                  <td className="border-b border-stone-100 py-3.5 font-semibold last:border-b-0">
                    {formatoMoneda(subtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 flex items-baseline justify-end gap-2 border-t border-stone-200 pt-4">
          <span className="text-sm text-stone-500">Total del remito:</span>
          <span className="text-2xl font-bold text-emerald-700">{formatoMoneda(total)}</span>
        </div>
      </section>

      {/* Notas */}
      {remito.notas && (
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-2 text-base font-bold text-stone-900">Notas</h2>
          <p className="text-sm leading-relaxed text-stone-600">{remito.notas}</p>
        </section>
      )}

      {/* Acciones al pie */}
      <div className="flex gap-3.5">
        <button
          onClick={() => navigate("/")}
          className="flex-1 rounded-xl border border-stone-200 bg-white px-6 py-4 text-base font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          Volver a remitos
        </button>
      </div>
    </main>
  );
}