import { useState, useMemo, useEffect } from "react";
import { Check, User, Clock, Plus, X, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../api/api";

const FORMAS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta"];

function formatoMoneda(valor) {
  const num = Number(valor) || 0;
  return (num < 0 ? "-$ " : "$ ") + Math.round(Math.abs(num)).toLocaleString("es-AR");
}

export default function RegistrarPago() {
  // 1. Datos del backend
  const [socios, setSocios] = useState([]);
  const [socioId, setSocioId] = useState("");
  const [remitosPendientes, setRemitosPendientes] = useState([]);
  const [cargandoRemitos, setCargandoRemitos] = useState(false);

  // 2. Formas de pago recibidas (Entrada a caja)
  const [formasPago, setFormasPago] = useState([]);
  const [formaNueva, setFormaNueva] = useState(FORMAS_PAGO[0]);
  const [montoFormaNueva, setMontoFormaNueva] = useState("");

  // 3. Remitos en orden de imputación
  const [remitoParaAgregar, setRemitoParaAgregar] = useState("");
  const [remitosAplicados, setRemitosAplicados] = useState([]);

  // 4. Cabecera
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));
  const [nroComprobante, setNroComprobante] = useState("");
  const [notas, setNotas] = useState("");

  // 5. Estado de UI
  const [guardando, setGuardando] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState(null);

  // Carga de socios
  useEffect(() => {
    async function fetchSocios() {
      try {
        const res = await api.get("/socios");
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setSocios(data);
          setSocioId(data[0].id);
        }
      } catch (err) {
        console.error("Error al cargar socios:", err);
        setErrorFeedback("No se pudieron cargar los socios.");
      }
    }
    fetchSocios();
  }, []);

  // Carga remitos del socio
  useEffect(() => {
    if (!socioId) return;

    async function fetchRemitos() {
      setCargandoRemitos(true);
      setRemitosAplicados([]);
      setRemitoParaAgregar("");
      setErrorFeedback(null);

      try {
        const res = await api.get(`/remitos/${socioId}`);
        const data = res.data;

        if (Array.isArray(data)) {
          const conDeuda = data
            .filter((r) => Number(r.saldo_pendiente) > 0)
            .map((r) => ({
              id: r.id,
              nroRemito: r.nro_remito ?? r.nroRemito,
              fecha: r.fecha,
              nroFactura: r.nro_factura ?? r.nroFactura,
              total: Number(r.total),
              saldoPendiente: Number(r.saldo_pendiente),
            }));

          setRemitosPendientes(conDeuda);
        } else {
          setRemitosPendientes([]);
        }
      } catch (err) {
        console.error("Error al traer remitos:", err);
        setRemitosPendientes([]);
      } finally {
        setCargandoRemitos(false);
      }
    }

    fetchRemitos();
  }, [socioId]);

  // Total de dinero ingresado en formas de pago
  const totalPago = useMemo(
    () => formasPago.reduce((acc, f) => acc + (parseFloat(f.monto) || 0), 0),
    [formasPago]
  );

  // DESCUENTO AUTOMÁTICO EN CASCADA
  // Cada remito toma automáticamente lo que necesita del pozo hasta agotarlo
  const remitosConImputacion = useMemo(() => {
    let pozoDisponible = totalPago;

    return remitosAplicados.map((r) => {
      const aCubrir = Math.min(r.saldoPendiente, Math.max(pozoDisponible, 0));
      pozoDisponible -= aCubrir;
      const quedaDebiendo = r.saldoPendiente - aCubrir;

      return {
        ...r,
        montoImputado: aCubrir,
        quedaDebiendo,
        esTotal: quedaDebiendo === 0,
        esParcial: quedaDebiendo > 0 && aCubrir > 0,
        sinFondos: aCubrir === 0,
      };
    });
  }, [remitosAplicados, totalPago]);

  const totalAplicado = useMemo(
    () => remitosConImputacion.reduce((acc, r) => acc + r.montoImputado, 0),
    [remitosConImputacion]
  );

  const saldoSinAplicar = totalPago - totalAplicado;

  const idsAplicados = useMemo(
    () => new Set(remitosAplicados.map((r) => r.id)),
    [remitosAplicados]
  );

  const remitosDisponibles = remitosPendientes.filter((r) => !idsAplicados.has(r.id));

  function cambiarSocio(id) {
    setSocioId(id);
    setRemitosAplicados([]);
    setRemitoParaAgregar("");
  }

  function agregarFormaPago() {
    const monto = parseFloat(montoFormaNueva);
    if (!formaNueva || !monto || monto <= 0) return;
    setFormasPago((prev) => [...prev, { id: crypto.randomUUID(), forma: formaNueva, monto }]);
    setMontoFormaNueva("");
  }

  function eliminarFormaPago(id) {
    setFormasPago((prev) => prev.filter((f) => f.id !== id));
  }

  // Agrega el remito a la fila; la imputación se descuenta sola en tiempo real
  function agregarRemito() {
    const remito = remitosPendientes.find((r) => r.id === remitoParaAgregar);
    if (!remito) return;
    setRemitosAplicados((prev) => [...prev, remito]);
    setRemitoParaAgregar("");
  }

  function quitarRemito(id) {
    setRemitosAplicados((prev) => prev.filter((r) => r.id !== id));
  }

  const puedeGuardar =
    formasPago.length > 0 &&
    remitosAplicados.length > 0 &&
    totalAplicado > 0 &&
    !guardando;

  // Envío final
  async function handleSubmit(e) {
    e.preventDefault();
    if (!puedeGuardar) return;

    setErrorFeedback(null);
    setGuardando(true);

    // Solo enviamos líneas que hayan absorbido dinero (> 0)
    const lineas = remitosConImputacion
      .filter((r) => r.montoImputado > 0)
      .map((r) => ({
        remito_id: r.id,
        monto_imputado: r.montoImputado,
      }));

    const payload = {
      socio_id: socioId,
      fecha_pago: fechaPago,
      monto: totalPago,
      nro_comprobante: nroComprobante.trim() || null,
      notas: notas.trim() || null,
      formas_pago: formasPago.map((f) => ({
        forma: f.forma.toLowerCase(),
        monto: Number(f.monto),
      })),
      lineas,
    };

    try {
      await api.post("/pagos", payload);

      setFormasPago([]);
      setRemitosAplicados([]);
      setNroComprobante("");
      setNotas("");
      alert("¡Pago registrado con éxito!");
    } catch (err) {
      console.error("Error al registrar pago:", err);
      setErrorFeedback(err.response?.data?.error || err.message || "Error al procesar el pago.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 md:px-9 text-stone-800">
      <div className="mb-2 text-sm text-stone-500">
        Pagos / <span className="font-semibold text-stone-800">Nuevo pago</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Registrar pago o transferencia</h1>
      </div>

      {errorFeedback && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorFeedback}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Socio */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-base font-bold text-stone-900">Datos del socio</h2>

          <div className="mb-4 flex flex-col gap-1.5">
            <label htmlFor="socio" className="flex items-center gap-1.5 text-sm text-stone-500">
              <User size={14} /> Socio
            </label>
            <select
              id="socio"
              value={socioId}
              onChange={(e) => cambiarSocio(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
            >
              {socios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {remitosPendientes.length > 0 && (
            <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Clock size={16} className="shrink-0" />
              Saldo pendiente total:{" "}
              <b className="font-semibold">
                {formatoMoneda(
                  remitosPendientes.reduce((acc, r) => acc + r.saldoPendiente, 0)
                )}
              </b>
              {" · "}
              {remitosPendientes.length} remito{remitosPendientes.length !== 1 ? "s" : ""} con saldo
            </div>
          )}
        </section>

        {/* 1. Formas de pago recibidas */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-1 text-base font-bold text-stone-900">1. Dinero cobrado</h2>
          <p className="mb-4 text-sm text-stone-500">
            Ingresá el dinero que entregó el cliente para habilitar las imputaciones.
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[160px] flex-col gap-1.5">
              <span className="text-sm text-stone-500">Forma de pago</span>
              <select
                value={formaNueva}
                onChange={(e) => setFormaNueva(e.target.value)}
                className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
              >
                {FORMAS_PAGO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
              <span className="text-sm text-stone-500">Monto</span>
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-100 px-3 focus-within:bg-white focus-within:outline-2 focus-within:outline-amber-500">
                <span className="text-stone-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={montoFormaNueva}
                  onChange={(e) => setMontoFormaNueva(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-base text-stone-800 outline-none placeholder:text-stone-400"
                />
              </div>
            </label>

            <button
              type="button"
              onClick={agregarFormaPago}
              disabled={!montoFormaNueva || parseFloat(montoFormaNueva) <= 0}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {formasPago.length > 0 && (
            <div className="flex flex-col gap-2">
              {formasPago.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                  <span className="text-sm font-semibold text-stone-800">{f.forma}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-stone-800">{formatoMoneda(f.monto)}</span>
                    <button
                      type="button"
                      onClick={() => eliminarFormaPago(f.id)}
                      title="Quitar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-baseline justify-end gap-2 border-t border-stone-200 pt-4">
            <span className="text-sm text-stone-500">Total recibido:</span>
            <span className="text-2xl font-bold text-emerald-700">{formatoMoneda(totalPago)}</span>
          </div>
        </section>

        {/* 2. Aplicar a remitos (Descuento automático) */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-1 text-base font-bold text-stone-900">2. Imputar remitos</h2>
          <p className="mb-4 text-sm text-stone-500">
            Elegí qué remitos cubrir. El saldo cobrado se irá descontando automáticamente en el orden que los cargues.
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
              <span className="text-sm text-stone-500">Remito</span>
              <select
                value={remitoParaAgregar}
                onChange={(e) => setRemitoParaAgregar(e.target.value)}
                disabled={cargandoRemitos || remitosDisponibles.length === 0 || saldoSinAplicar <= 0}
                className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500 disabled:opacity-50"
              >
                <option value="">
                  {totalPago === 0
                    ? "Primero cargá una forma de pago"
                    : saldoSinAplicar <= 0
                    ? "Ya consumiste todo el dinero cobrado"
                    : remitosDisponibles.length === 0
                    ? "No hay más remitos con deuda"
                    : "Seleccioná un remito"}
                </option>
                {remitosDisponibles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nroRemito} · {r.fecha} · Debe {formatoMoneda(r.saldoPendiente)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={agregarRemito}
              disabled={!remitoParaAgregar || saldoSinAplicar <= 0}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {remitosConImputacion.length === 0 ? (
            <div className="rounded-lg bg-stone-100 px-4 py-6 text-center text-sm text-stone-500">
              Todavía no seleccionaste ningún remito para este pago.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {remitosConImputacion.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 p-3.5 bg-stone-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900">{r.nroRemito}</span>
                      {r.esTotal && (
                        <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 size={12} /> CANCELADO
                        </span>
                      )}
                      {r.esParcial && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          PAGO PARCIAL
                        </span>
                      )}
                      {r.sinFondos && (
                        <span className="rounded bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
                          SIN SALDO
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      Deuda original: {formatoMoneda(r.saldoPendiente)}
                      {r.quedaDebiendo > 0 && (
                        <span className="ml-1 font-medium text-amber-700">
                          · Quedará debiendo: {formatoMoneda(r.quedaDebiendo)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vista fija del monto imputado (sin input editable) */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-stone-500">Se le imputa:</div>
                      <div className="text-base font-extrabold text-emerald-700">
                        {formatoMoneda(r.montoImputado)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => quitarRemito(r.id)}
                      title="Quitar remito"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-100"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saldo disponible en mano */}
          <div
            className={
              "mt-4 flex items-center justify-between rounded-lg px-4 py-3.5 " +
              (saldoSinAplicar > 0
                ? "bg-sky-50 text-sky-800"
                : "bg-emerald-50 text-emerald-800")
            }
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wallet size={16} />
              {saldoSinAplicar > 0
                ? "Saldo disponible en mano para seguir imputando"
                : "Todo el dinero cobrado ha sido imputado"}
            </div>
            <span className="text-xl font-bold">{formatoMoneda(saldoSinAplicar)}</span>
          </div>
        </section>

        {/* 3. Datos generales */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-base font-bold text-stone-900">3. Datos del comprobante</h2>

          <div className="mb-5 flex flex-wrap gap-4">
            <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
              <span className="text-sm text-stone-500">Fecha de pago</span>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
              />
            </label>

            <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
              <span className="text-sm text-stone-500">N° de comprobante (opcional)</span>
              <input
                type="text"
                placeholder="Ej: TRF-00981"
                value={nroComprobante}
                onChange={(e) => setNroComprobante(e.target.value)}
                className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notas" className="text-sm text-stone-500">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              rows={3}
              placeholder="Cualquier aclaración sobre este pago..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full resize-y rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-2 focus:outline-amber-500"
            />
          </div>
        </section>

        {/* Acciones */}
        <div className="flex gap-3.5">
          <button
            type="button"
            className="rounded-xl border border-stone-200 bg-white px-6 py-4 text-base font-semibold text-stone-500 hover:bg-stone-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {guardando ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Registrando...
              </>
            ) : (
              <>
                <Check size={18} /> Registrar pago
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}