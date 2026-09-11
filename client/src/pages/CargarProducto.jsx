import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import  Sidebar  from "../components/Sidebar.jsx";
import { Check, User, Loader2 } from "lucide-react";
import { api } from "../api/api";

export default function CargarProducto() {
  const navigate = useNavigate();

  // Estados de socios desde la API
  const [socios, setSocios] = useState([]);
  const [socioId, setSocioId] = useState("");
  const [cargandoSocios, setCargandoSocios] = useState(true);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [precioReferencia, setPrecioReferencia] = useState("");
  const [activo, setActivo] = useState(true);

  // Estados de control
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  // Traer socios al montar
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

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorForm(null);

    if (!socioId) {
      setErrorForm("Debés seleccionar un socio.");
      return;
    }

    if (!nombre.trim()) {
      setErrorForm("El nombre del producto es obligatorio.");
      return;
    }

    const payload = {
      socio_id: socioId,
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      precio_referencia: precioReferencia === "" ? 0 : Number(precioReferencia),
      activo,
    };

    setGuardando(true);
    try {
      await api.post("/productos", payload);
      navigate("/productos"); // Redirige al listado o al dashboard
    } catch (err) {
      console.error("Error al crear producto:", err);
      setErrorForm(err.response?.data?.error || "Error al guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="w-full bg-stone-100 text-stone-800">
      {/* Formulario */}
      <main className="mx-auto w-full max-w-2xl px-5 py-8 md:px-9">
        <div className="mb-2 text-sm text-stone-500">
          Productos / <span className="font-semibold text-stone-800">Nuevo producto</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Cargar nuevo producto</h1>
          <div className="mt-1 text-sm text-stone-500">Se asocia a un socio para sus remitos</div>
        </div>

        {errorForm && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorForm}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-base font-bold text-stone-900">Datos del producto</h2>

            {/* Selector de socio */}
            <div className="mb-4 flex flex-col gap-1.5">
              <label htmlFor="socio" className="flex items-center gap-1.5 text-sm text-stone-500">
                <User size={14} /> Socio
              </label>
              <select
                id="socio"
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
            </div>

            {/* Nombre y Código */}
            <div className="mb-4 flex flex-wrap gap-4">
              <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
                <span className="text-sm text-stone-500">Nombre del producto *</span>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fenólico 700 Bs As"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500"
                />
              </label>

              <label className="flex min-w-[140px] flex-1 flex-col gap-1.5">
                <span className="text-sm text-stone-500">Código (opcional)</span>
                <input
                  type="text"
                  placeholder="Ej: FEN-700"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500"
                />
              </label>
            </div>

            {/* Precio de referencia y Estado */}
            <div className="mb-1 flex flex-wrap gap-4">
              <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                <span className="text-sm text-stone-500">Precio de referencia</span>
                <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-100 px-3 focus-within:bg-white focus-within:outline-2 focus-within:outline-amber-500">
                  <span className="text-stone-400 font-semibold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={precioReferencia}
                    onChange={(e) => setPrecioReferencia(e.target.value)}
                    className="w-full bg-transparent py-2.5 text-base text-stone-800 outline-none placeholder:text-stone-400"
                  />
                </div>
                <span className="text-xs text-stone-400">
                  Se precargará automáticamente al elegir este producto en un remito
                </span>
              </label>

              <div className="flex min-w-[140px] flex-1 flex-col justify-center gap-1.5">
                <span className="text-sm text-stone-500">Estado</span>
                <label className="flex items-center gap-2 pt-2 text-sm text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  Producto activo
                </label>
              </div>
            </div>
          </section>

          {/* Botones de acción */}
          <div className="flex gap-3.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-stone-200 bg-white px-6 py-4 text-base font-semibold text-stone-500 hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {guardando ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Guardando...
                </>
              ) : (
                <>
                  <Check size={18} /> Guardar producto
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}