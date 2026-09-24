// src/components/Paginador.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Paginador({
  paginacion,
  alCambiarPagina,
  cargando = false,
  nombreEntidad = "registros",
}) {
  // Si no hay datos cargados todavía o no hay registros, no dibuja nada
  if (!paginacion || paginacion.totalRegistros === 0) return null;

  const {
    totalRegistros = 0,
    totalPaginas = 1,
    paginaActual = 1,
    limite = 10,
    tieneAnterior = false,
    tieneSiguiente = false,
  } = paginacion;

  // Calculamos el rango visible (ej: "1 al 10", "11 al 20")
  const desde = (paginaActual - 1) * limite + 1;
  const hasta = Math.min(paginaActual * limite, totalRegistros);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
      {/* Texto informativo */}
      <div>
        Mostrando <span className="font-semibold text-stone-900">{desde}</span> a{" "}
        <span className="font-semibold text-stone-900">{hasta}</span> de{" "}
        <span className="font-semibold text-stone-900">{totalRegistros}</span>{" "}
        {nombreEntidad}
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-stone-400 mr-2">
          Página {paginaActual} de {totalPaginas}
        </span>

        {/* Botón Anterior */}
        <button
          type="button"
          disabled={!tieneAnterior || cargando}
          onClick={() => alCambiarPagina(paginaActual - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Botón Siguiente */}
        <button
          type="button"
          disabled={!tieneSiguiente || cargando}
          onClick={() => alCambiarPagina(paginaActual + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}