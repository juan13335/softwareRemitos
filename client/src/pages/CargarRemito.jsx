import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Check, User, Loader2 } from "lucide-react";
import { api } from "../api/api";

// Temporal hasta tener el endpoint de productos
const PRODUCTOS = [
  { id: "6b29d020-d98c-42c3-a3be-5da4162bf8d4", nombre: "Fenólico 700 Bs As", precio: 2800 },
  { id: "ab901297-3f7d-49df-b22e-a3dc30f88c1a", nombre: "Aglomerado recuperado", precio: 1800 },
];

function nuevoItem() {
  return { id: crypto.randomUUID(), productoId: "", cantidad: 1, precioUnitario: 0 };
}

function formatoMoneda(valor) {
  return "$ " + Math.round(valor).toLocaleString("es-AR");
}

export default function CargarRemito() {
  const navigate = useNavigate();

  // Estados para socios desde la API
  const [socios, setSocios] = useState([]);
  const [socioId, setSocioId] = useState("");
  const [cargandoSocios, setCargandoSocios] = useState(true);

  // Estados del formulario
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nroRemito, setNroRemito] = useState("");
  const [nroFactura, setNroFactura] = useState("");
  const [sinFactura, setSinFactura] = useState(false);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState([nuevoItem()]);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  // Llamada al endpoint GET /api/socios al montar el componente
  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const res = await api.get("/socios");
        setSocios(res.data);
        // Si hay al menos uno, dejamos el primero seleccionado por defecto
        if (res.data.length > 0) {
          setSocioId(res.data[0].id);
        }
      } catch (err) {
        console.error("Error al cargar socios:", err);
        setErrorForm("No se pudo cargar la lista de socios.");
      } finally {
        setCargandoSocios(false);
      }
    };

    fetchSocios();
  }, []);


  const total = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);

  function actualizarItem(id, cambios) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  function seleccionarProducto(id, productoId) {
    const producto = PRODUCTOS.find((p) => p.id === productoId);
    actualizarItem(id, {
      productoId,
      precioUnitario: producto ? producto.precio : 0,
    });
  }

  function agregarItem() {
    setItems((prev) => [...prev, nuevoItem()]);
  }

  function eliminarItem(id) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorForm(null);

    if (!socioId) {
    setErrorForm("Debés seleccionar un socio.");
    return;
  }

  if (!nroRemito.trim()) {
    setErrorForm("El número de remito es obligatorio.");
    return;
  }

    const itemsValidos = items.filter((it) => it.productoId && it.cantidad > 0);
    if (itemsValidos.length === 0) {
      setErrorForm("Debés incluir al menos un producto con cantidad mayor a 0.");
      return;
    }

    // Payload adaptado a tu modelo de Express y Supabase
    const payload = {
    fecha,
    nro_remito: nroRemito.trim(),
    nro_factura: sinFactura ? null : nroFactura.trim() || null,
    socio_id: socioId, // UUID obtenido del GET
    notas: notas.trim() || null,
    items: itemsValidos.map((it) => ({
      producto_id: it.productoId,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precioUnitario),
    })),
  };

    setGuardando(true);
    try {
      await api.post("/remitos", payload);
      navigate("/"); // Redirige al dashboard al terminar
    } catch (err) {
      console.error("Error al guardar remito:", err);
      setErrorForm(err.response?.data?.error || "Error al registrar el remito.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 md:px-9">
      <div className="mb-2 text-sm text-stone-500">
        Remitos / <span className="font-semibold text-stone-800">Nuevo remito</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Cargar nuevo remito</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <User size={14} /> Socio: Nestor
          </div>
        </div>
      </div>

      {errorForm && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorForm}
        </div>
      )}

      {/* Datos del remito */}
      <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Datos del comprobante</h2>

        <div className="mb-4 flex flex-wrap gap-4">
            {/* Selector de Socio */}
            <label className="flex flex-col gap-1.5">
            <span className="text-sm text-stone-500">Socio</span>
            <select
                value={socioId}
                disabled={cargandoSocios}
                onChange={(e) => setSocioId(e.target.value)}
                className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500 disabled:opacity-50"
            >
                {cargandoSocios ? (
                <option value="">Cargando socios...</option>
                ) : (
                socios.map((s) => (
                    <option key={s.id} value={s.id}>
                    {s.nombre}
                    </option>
                ))
                )}
            </select>
            </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <span className="text-sm text-stone-500">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
            />
          </label>

          <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <span className="text-sm text-stone-500">N° de remito</span>
            <input
              type="text"
              placeholder="Ej: R-000413"
              value={nroRemito}
              onChange={(e) => setNroRemito(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500"
            />
          </label>

          <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <span className="text-sm text-stone-500">N° de factura</span>
            <input
              type="text"
              placeholder="Ej: FC-0001-4590"
              value={nroFactura}
              disabled={sinFactura}
              onChange={(e) => setNroFactura(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500 disabled:opacity-50"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
          <input
            type="checkbox"
            checked={sinFactura}
            onChange={(e) => {
              setSinFactura(e.target.checked);
              if (e.target.checked) setNroFactura("");
            }}
            className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
          />
          Todavía no tengo el número de factura
        </label>
      </section>

      {/* Productos entregados */}
      <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Productos entregados</h2>

        <div className="mb-1.5 hidden gap-2 px-1 text-xs font-semibold text-stone-500 sm:grid sm:grid-cols-[1fr_90px_120px_120px_36px]">
          <span>Producto</span>
          <span>Cantidad</span>
          <span>Precio unit.</span>
          <span>Subtotal</span>
          <span />
        </div>

        <div className="flex flex-col gap-2 border-t border-stone-200 pt-3">
          {items.map((item) => {
            const subtotal = item.cantidad * item.precioUnitario;
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 items-center gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_90px_120px_120px_36px] sm:border-none sm:p-0"
              >
                <select
                  value={item.productoId}
                  onChange={(e) => seleccionarProducto(item.id, e.target.value)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                >
                  <option value="">Seleccioná un producto</option>
                  {PRODUCTOS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitario}
                  onChange={(e) => actualizarItem(item.id, { precioUnitario: parseFloat(e.target.value) || 0 })}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                />

                <span className="text-sm font-bold text-stone-800">{formatoMoneda(subtotal)}</span>

                <button
                  type="button"
                  onClick={() => eliminarItem(item.id)}
                  disabled={items.length === 1}
                  title="Quitar producto"
                  className="flex h-9 w-9 items-center justify-center justify-self-end rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent sm:justify-self-center"
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={agregarItem}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 py-2.5 text-sm font-semibold text-sky-700 hover:border-sky-600 hover:bg-sky-50 transition-colors"
        >
          <Plus size={16} /> Agregar otro producto
        </button>

        <div className="mt-4 flex items-baseline justify-end gap-2 border-t border-stone-200 pt-4">
          <span className="text-sm text-stone-500">Total del remito:</span>
          <span className="text-2xl font-bold text-emerald-700">{formatoMoneda(total)}</span>
        </div>
      </section>

      {/* Notas */}
      <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Notas (opcional)</h2>
        <textarea
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Aclaraciones sobre la entrega..."
          className="w-full resize-y rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500"
        />
      </section>

      {/* Botones de acción */}
      <div className="flex gap-3.5">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-xl border border-stone-200 bg-white px-6 py-4 text-base font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={handleSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
        >
          {guardando ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Guardando...
            </>
          ) : (
            <>
              <Check size={18} /> Guardar remito
            </>
          )}
        </button>
      </div>
    </main>
  );
}