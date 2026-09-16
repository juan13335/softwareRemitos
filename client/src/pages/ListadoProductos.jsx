import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Package, User, Plus, Search, Loader2 } from "lucide-react";
import { api } from "../api/api.js"; // Ajustá la ruta según la ubicación de tu archivo api

function formatoMoneda(valor) {
  const num = Number(valor) || 0;
  return "$ " + Math.round(num).toLocaleString("es-AR");
}

export default function ListadoProductos() {
  const [productos, setProductos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [socioId, setSocioId] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  // Carga inicial de productos y socios
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        const [resProductos, resSocios] = await Promise.all([
          api.get("/productos"),
          api.get("/socios"),
        ]);

        setProductos(resProductos.data || []);
        setSocios(resSocios.data || []);
      } catch (err) {
        console.error("Error cargando productos o socios:", err);
        setError("Ocurrió un error al cargar la información. Reintentá en unos momentos.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  function nombreSocio(id) {
    return socios.find((s) => s.id === id)?.nombre ?? "—";
  }
  // Filtro combinado: Socio + Texto (soporta snake_case y camelCase)
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (!p.activo) return false; // Solo mostrar productos activos
      // Compara contra el id dentro del objeto socio
      const coincideSocio = socioId === "todos" || p.socio?.id === socioId;

      const termino = busqueda.toLowerCase().trim();
      const coincideTexto =
        termino === "" ||
        p.nombre?.toLowerCase().includes(termino) ||
        (p.codigo && p.codigo.toLowerCase().includes(termino));

      return coincideSocio && coincideTexto;
    });
  }, [productos, socioId, busqueda]);

  function nuevoProducto() {
    navigate("/productos/nuevo")
  }

  function editarProducto(producto) {
    // navigate(`/productos/${producto.id}/editar`)
    alert(`Editar: ${producto.nombre}`);
  }

  async function alternarEstadoProducto(producto) {
    const estadoActual = producto.activo;
    const accion = estadoActual ? "desactivar" : "activar";
    const confirmado = window.confirm(`¿Querés ${accion} "${producto.nombre}"?`);
    if (!confirmado) return;

    try {
      // Si ya tenés endpoint de actualización o soft-delete:
      // await api.patch(`/api/productos/${producto.id}`, { activo: !estadoActual });

      // Actualización optimista en el estado local
      setProductos((prev) =>
        prev.map((p) => (p.id === producto.id ? { ...p, activo: !estadoActual } : p))
      );
    } catch (err) {
      console.error("Error al actualizar estado del producto:", err);
      alert("No se pudo cambiar el estado del producto.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-9 text-stone-800">
      <div className="mb-2 text-sm text-stone-500">
        Productos / <span className="font-semibold text-stone-800">Listado</span>
      </div>

      {/* Cabecera y botón de alta */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
          <div className="mt-0.5 text-sm text-stone-500">Catálogo de productos por socio</div>
        </div>

        <button
          onClick={nuevoProducto}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      {/* Barra de herramientas: Búsqueda y Filtro de socio */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-2 focus:outline-amber-500 disabled:bg-stone-50"
          />
        </div>

        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <select
            value={socioId}
            onChange={(e) => setSocioId(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-8 pr-3 text-sm text-stone-800 focus:outline-2 focus:outline-amber-500 disabled:bg-stone-50"
          >
            <option value="todos">Todos los socios</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Contador de resultados */}
      {!loading && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-sky-50 px-4 py-2.5 text-xs font-medium text-sky-800">
          <Package size={15} className="shrink-0" />
          <span>
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
            {socioId !== "todos" ? ` de ${nombreSocio(socioId)}` : ""}
          </span>
        </div>
      )}

      {/* Tabla con estados de Carga, Vacío y Resultados */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-stone-500">
            <Loader2 size={24} className="animate-spin text-stone-400" />
            <span className="text-sm">Cargando catálogo...</span>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-stone-500">
            No se encontraron productos cargados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">Socio</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500">Precio ref.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500">Estado</th>
                  <th className="w-24 px-4 py-3 text-right text-xs font-semibold text-stone-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {productosFiltrados.map((p) => {
                  const sId = p.socio_id ?? p.socioId;
                  const precio = p.precio_referencia ?? p.precioReferencia;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-stone-900">{p.nombre}</td>
                      <td className="px-4 py-3.5 text-stone-600">
                        {p.codigo ? (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
                            {p.codigo}
                          </span>
                        ) : (
                          <span className="italic text-stone-400 text-xs">Sin código</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-stone-600">{p.socio?.nombre ?? "—"}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-stone-900">
                        {formatoMoneda(precio)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium " +
                            (p.activo ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500")
                          }
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => editarProducto(p)}
                            title="Editar producto"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => alternarEstadoProducto(p)}
                            title={p.activo ? "Desactivar producto" : "Activar producto"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
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