// src/components/TablaRemitos.jsx
import { Eye, Pencil, Trash2 } from "lucide-react";
import EstadoRemito from "./EstadoRemito.jsx";
import Cargando from "./IconoCargando.jsx";

function formatoMoneda(valor) {
  const num = Number(valor) || 0;
  return (num < 0 ? "-$ " : "$ ") + Math.round(Math.abs(num)).toLocaleString("es-AR");
}

function formatoFecha(fechaIso) {
  if (!fechaIso) return "—";
  const [y, m, d] = fechaIso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export default function TablaRemitos({
  remitos = [],
  cargando = false,
  socios = [],
  mostrarAcciones = true,
  onVer,
  onEditar,
  onEliminar,
  mensajeVacio = "No hay remitos que coincidan con los filtros aplicados.",
}) {
  function getNombreSocio(r) {
    if (r.socio_nombre) return r.socio_nombre;
    const id = r.socio_id || r.socioId;
    return socios.find((s) => s.id === id)?.nombre ?? "—";
  }

  if (cargando) {
     return <Cargando loading={cargando} nombreEntidad="datos"/>
  }

  if (remitos.length === 0) {
    return (
      <div className="px-4 py-14 text-center text-sm text-stone-500">
        {mensajeVacio}
      </div>
    );
  }
  

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">N° remito</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">N° factura</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">Socio</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500">Total</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500">Saldo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">Estado</th>
            {mostrarAcciones && (
              <th className="w-32 px-4 py-3 text-right text-xs font-semibold text-stone-500">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {remitos.map((r) => (
            <tr
              key={r.id}
              className="border-b border-stone-200 odd:bg-white even:bg-stone-50 hover:bg-stone-100"
            >
              <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">
                {formatoFecha(r.fecha)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-stone-800">
                {r.nro_remito || r.nroRemito}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">
                {(r.nro_factura || r.nroFactura) || (
                  <span className="italic text-stone-400">Sin factura</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-stone-600">
                {getNombreSocio(r)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-stone-800">
                {formatoMoneda(r.total)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-stone-800">
                {formatoMoneda(r.saldo_pendiente ?? r.saldoPendiente)}
              </td>
              <td className="px-4 py-3.5">
                <EstadoRemito estado={r.estado_cobro_cliente} />
              </td>

              {mostrarAcciones && (
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {onVer && (
                      <button
                        type="button"
                        onClick={() => onVer(r)}
                        title="Ver detalle"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {onEditar && (
                      <button
                        type="button"
                        onClick={() => onEditar(r)}
                        title="Editar remito"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sky-700 hover:bg-sky-50 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        type="button"
                        onClick={() => onEliminar(r)}
                        title="Eliminar remito"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}