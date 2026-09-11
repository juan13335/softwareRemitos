import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Check, User, Loader2 } from "lucide-react";
import { api } from "../api/api";

function nuevoItem() {
  return { id: crypto.randomUUID(), productoId: "", cantidad: 1, precioUnitario: 0 };
}

function formatoMoneda(valor) {
  return "$ " + Math.round(valor || 0).toLocaleString("es-AR");
}

export default function CargarRemito() {
  const navigate = useNavigate();

  // Estados de datos maestros
  const [socios, setSocios] = useState([]);
  const [socioId, setSocioId] = useState("");
  const [cargandoSocios, setCargandoSocios] = useState(true);

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Estados del comprobante
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [puntoVenta, setPuntoVenta] = useState("0001");
  const [numeroRemito, setNumeroRemito] = useState("");

  // Factura
  const [letraFactura, setLetraFactura] = useState("A");
  const [pvFactura, setPvFactura] = useState("00013");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [sinFactura, setSinFactura] = useState(false);

  // Remito general
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState([nuevoItem()]);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  // Formateo de números de comprobantes al salir del input
  const formatearNumero = () => {
    if (!numeroRemito) return;
    const soloNumeros = numeroRemito.replace(/\D/g, "");
    setNumeroRemito(soloNumeros.padStart(8, "0").slice(-8));
  };

  const formatearPV = () => {
    if (!puntoVenta) return;
    const soloNumeros = puntoVenta.replace(/\D/g, "");
    setPuntoVenta(soloNumeros.padStart(4, "0").slice(-4));
  };

  const formatearPvFactura = () => {
    if (!pvFactura) return;
    const soloNumeros = pvFactura.replace(/\D/g, "");
    setPvFactura(soloNumeros.padStart(5, "0").slice(-5));
  };

  const formatearNumeroFactura = () => {
    if (!numeroFactura) return;
    const soloNumeros = numeroFactura.replace(/\D/g, "");
    setNumeroFactura(soloNumeros.padStart(8, "0").slice(-8));
  };

  // Carga inicial de datos
  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const res = await api.get("/socios");
        setSocios(res.data);
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

  useEffect(() => {
    const cargarListaProductos = async () => {
      try {
        const res = await api.get("/productos");
        setProductos(res.data);
      } catch (err) {
        console.error("Error al traer productos:", err);
      } finally {
        setCargandoProductos(false);
      }
    };

    cargarListaProductos();
  }, []);

  // Total acumulado del remito
  const total = items.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0),
    0
  );

  // Manejadores de ítems
  function agregarItem() {
    setItems((prev) => [...prev, nuevoItem()]);
  }

  function eliminarItem(id) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  function handleCambioProducto(index, productoId) {
    const prodSeleccionado = productos.find((p) => String(p.id) === String(productoId));
    const precioSugerido = prodSeleccionado
      ? Number(prodSeleccionado.precio_referencia ?? prodSeleccionado.precio ?? 0)
      : 0;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, productoId, precioUnitario: precioSugerido }
          : item
      )
    );
  }

  function handleCambioCantidad(index, valor) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, cantidad: valor === "" ? "" : Number(valor) }
          : item
      )
    );
  }

  function handleCambioPrecio(index, valor) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, precioUnitario: valor === "" ? "" : Number(valor) }
          : item
      )
    );
  }

  // Envío del formulario
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorForm(null);

    if (!socioId) {
      setErrorForm("Debés seleccionar un socio.");
      return;
    }

    if (!numeroRemito.trim()) {
      setErrorForm("El número de remito es obligatorio.");
      return;
    }

    const itemsValidos = items.filter(
      (it) => it.productoId && Number(it.cantidad) > 0
    );

    if (itemsValidos.length === 0) {
      setErrorForm("Debés incluir al menos un producto con cantidad mayor a 0.");
      return;
    }

    const nroRemitoCompleto = `${puntoVenta.padStart(4, "0")} - ${numeroRemito.padStart(8, "0")}`;
    const nroFacturaCompleto =
      sinFactura || !numeroFactura.trim()
        ? null
        : `${letraFactura.toUpperCase()} - ${pvFactura.padStart(5, "0")} - ${numeroFactura.padStart(8, "0")}`;

    const payload = {
      fecha,
      nro_remito: nroRemitoCompleto,
      nro_factura: nroFacturaCompleto,
      socio_id: socioId,
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
      navigate("/");
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
            <User size={14} /> Socio seleccionado: {socios.find((s) => s.id === socioId)?.nombre || "—"}
          </div>
        </div>
      </div>

      {errorForm && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorForm}
        </div>
      )}

      {/* Datos del comprobante */}
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

          {/* Fecha */}
          <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
            <span className="text-sm text-stone-500">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
            />
          </label>

          {/* N° de remito */}
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <span className="text-sm text-stone-500">N° de remito</span>
            <div className="flex items-center rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500">
              <input
                type="text"
                maxLength={4}
                value={puntoVenta}
                onChange={(e) => setPuntoVenta(e.target.value.replace(/\D/g, ""))}
                onBlur={formatearPV}
                className="w-12 bg-transparent text-center font-mono text-base font-semibold text-stone-800 outline-none"
              />
              <span className="px-1.5 font-mono font-bold text-stone-400">—</span>
              <input
                type="text"
                maxLength={8}
                placeholder="00000000"
                value={numeroRemito}
                onChange={(e) => setNumeroRemito(e.target.value.replace(/\D/g, ""))}
                onBlur={formatearNumero}
                className="w-full bg-transparent font-mono text-base font-semibold text-stone-800 placeholder:text-stone-400 outline-none"
              />
            </div>
          </div>

          {/* N° de factura */}
          <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
            <span className="text-sm text-stone-500">N° de factura</span>
            <div
              className={`flex items-center rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 transition-all ${
                sinFactura
                  ? "opacity-40 cursor-not-allowed"
                  : "focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500"
              }`}
            >
              <input
                type="text"
                maxLength={1}
                disabled={sinFactura}
                value={letraFactura}
                onChange={(e) => setLetraFactura(e.target.value.toUpperCase())}
                className="w-6 bg-transparent text-center font-mono text-base font-semibold text-stone-800 outline-none uppercase disabled:cursor-not-allowed"
              />
              <span className="px-1 font-mono font-bold text-stone-400">—</span>
              <input
                type="text"
                maxLength={5}
                disabled={sinFactura}
                value={pvFactura}
                onChange={(e) => setPvFactura(e.target.value.replace(/\D/g, ""))}
                onBlur={formatearPvFactura}
                className="w-14 bg-transparent text-center font-mono text-base font-semibold text-stone-800 outline-none disabled:cursor-not-allowed"
              />
              <span className="px-1 font-mono font-bold text-stone-400">—</span>
              <input
                type="text"
                maxLength={8}
                placeholder="00000000"
                disabled={sinFactura}
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value.replace(/\D/g, ""))}
                onBlur={formatearNumeroFactura}
                className="w-full bg-transparent font-mono text-base font-semibold text-stone-800 placeholder:text-stone-400 outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
          <input
            type="checkbox"
            checked={sinFactura}
            onChange={(e) => {
              setSinFactura(e.target.checked);
              if (e.target.checked) setNumeroFactura("");
            }}
            className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
          />
          Todavía no tengo el número de factura
        </label>
      </section>

      {/* Tabla de productos entregados */}
      <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-stone-900">Productos entregados</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="pb-2.5 text-left text-xs font-semibold">Producto</th>
                <th className="pb-2.5 px-2 text-left text-xs font-semibold w-24">Cantidad</th>
                <th className="pb-2.5 px-2 text-left text-xs font-semibold w-32">Precio unit.</th>
                <th className="pb-2.5 pl-2 text-right text-xs font-semibold w-28">Subtotal</th>
                <th className="pb-2.5 pl-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const subtotal =
                  (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0);

                return (
                  <tr key={item.id} className="border-b border-stone-100 last:border-b-0">
                    {/* Selector de producto */}
                    <td className="py-2.5 pr-2">
                      <select
                        value={item.productoId || ""}
                        onChange={(e) => handleCambioProducto(index, e.target.value)}
                        disabled={cargandoProductos}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">
                          {cargandoProductos ? "Cargando productos..." : "Seleccionar producto..."}
                        </option>
                        {productos.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.nombre}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Cantidad */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad ?? ""}
                        onChange={(e) => handleCambioCantidad(index, e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
                      />
                    </td>

                    {/* Precio Unitario */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.precioUnitario ?? ""}
                        onChange={(e) => handleCambioPrecio(index, e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
                      />
                    </td>

                    {/* Subtotal */}
                    <td className="py-2.5 pl-2 text-right font-semibold text-stone-700">
                      {formatoMoneda(subtotal)}
                    </td>

                    {/* Botón eliminar ítem */}
                    <td className="py-2.5 pl-2 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarItem(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                          title="Quitar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={agregarItem}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 py-2.5 text-sm font-semibold text-amber-700 hover:border-amber-600 hover:bg-amber-50 transition-colors"
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