import { useState, useMemo, useEffect } from "react";
import { Check, User, Clock, Plus, X, Wallet, Loader2 } from "lucide-react";
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

  // 2. Formas de pago recibidas (pago_metodos)
  const [formasPago, setFormasPago] = useState([]);
  const [formaNueva, setFormaNueva] = useState(FORMAS_PAGO[0]);
  const [montoFormaNueva, setMontoFormaNueva] = useState("");

  // 3. Imputaciones a remitos (pago_remitos)
  const [remitoParaAgregar, setRemitoParaAgregar] = useState("");
  const [remitosAplicados, setRemitosAplicados] = useState([]);

  // 4. Cabecera (pagos_socio)
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));
  const [nroComprobante, setNroComprobante] = useState("");
  const [notas, setNotas] = useState("");

  // 5. Feedback y control
  const [guardando, setGuardando] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState(null);

  // Carga de socios con tu cliente api
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

  // Carga de remitos del socio
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

  // Cálculos en pantalla
  const saldoPendienteTotal = useMemo(
    () => remitosPendientes.reduce((acc, r) => acc + r.saldoPendiente, 0),
    [remitosPendientes]
  );

  const idsAplicados = useMemo(
    () => new Set(remitosAplicados.map((r) => r.id)),
    [remitosAplicados]
  );

  const remitosDisponibles = remitosPendientes.filter((r) => !idsAplicados.has(r.id));

  const totalPago = useMemo(
    () => formasPago.reduce((acc, f) => acc + (parseFloat(f.monto) || 0), 0),
    [formasPago]
  );

  const totalAplicado = useMemo(
    () => remitosAplicados.reduce((acc, r) => acc + (parseFloat(r.montoImputado) || 0), 0),
    [remitosAplicados]
  );

  const saldoSinAplicar = totalPago - totalAplicado;

  const hayExcesoPorRemito = remitosAplicados.some(
    (r) =>
      (parseFloat(r.montoImputado) || 0) > r.saldoPendiente ||
      (parseFloat(r.montoImputado) || 0) <= 0
  );

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

  function agregarRemito() {
    const remito = remitosPendientes.find((r) => r.id === remitoParaAgregar);
    if (!remito) return;

    setRemitosAplicados((prev) => [
      ...prev,
      { ...remito, montoImputado: String(remito.saldoPendiente) },
    ]);
    setRemitoParaAgregar("");
  }

  function actualizarMontoImputado(id, monto) {
    setRemitosAplicados((prev) =>
      prev.map((r) => (r.id === id ? { ...r, montoImputado: monto } : r))
    );
  }

  function quitarRemito(id) {
    setRemitosAplicados((prev) => prev.filter((r) => r.id !== id));
  }

  const puedeGuardar =
    formasPago.length > 0 &&
    remitosAplicados.length > 0 &&
    saldoSinAplicar >= 0 &&
    !hayExcesoPorRemito &&
    !guardando;

  // Envío al backend usando api.post
  async function handleSubmit(e) {
    e.preventDefault();
    if (!puedeGuardar) return;

    setErrorFeedback(null);
    setGuardando(true);

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
      lineas: remitosAplicados.map((r) => ({
        remito_id: r.id,
        monto_imputado: Number(r.montoImputado),
      })),
    };

    try {
      await api.post("/pagos", payload);

      setFormasPago([]);
      setRemitosAplicados([]);
      setNroComprobante("");
      setNotas("");
      alert("Pago registrado y remitos actualizados con éxito.");
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

          {saldoPendienteTotal > 0 && (
            <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Clock size={16} className="shrink-0" />
              Saldo pendiente total: <b className="font-semibold">{formatoMoneda(saldoPendienteTotal)}</b>
              {" · "}
              {remitosPendientes.length} remito{remitosPendientes.length !== 1 ? "s" : ""} con saldo
            </div>
          )}
        </section>

        {/* Formas de pago recibidas */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-1 text-base font-bold text-stone-900">¿Cuánto y cómo pagó el cliente?</h2>
          <p className="mb-4 text-sm text-stone-500">
            Cargá cada forma de pago por separado si entregó, por ejemplo, parte en efectivo y parte por transferencia.
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

        {/* Aplicar a remitos */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-1 text-base font-bold text-stone-900">Aplicar a remitos</h2>
          <p className="mb-4 text-sm text-stone-500">
            Elegí qué remitos se cubren con el total recibido. El monto se precarga con el saldo pendiente, pero podés editarlo si es un pago parcial.
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
              <span className="text-sm text-stone-500">Remito</span>
              <select
                value={remitoParaAgregar}
                onChange={(e) => setRemitoParaAgregar(e.target.value)}
                disabled={cargandoRemitos || remitosDisponibles.length === 0}
                className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500 disabled:opacity-50"
              >
                <option value="">
                  {cargandoRemitos
                    ? "Cargando remitos..."
                    : remitosDisponibles.length === 0
                    ? "No hay más remitos con saldo"
                    : "Seleccioná un remito"}
                </option>
                {remitosDisponibles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nroRemito} · {r.fecha} · saldo {formatoMoneda(r.saldoPendiente)}
                    {r.saldoPendiente < r.total ? " (parcial)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={agregarRemito}
              disabled={!remitoParaAgregar}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {remitosAplicados.length === 0 ? (
            <div className="rounded-lg bg-stone-100 px-4 py-6 text-center text-sm text-stone-500">
              Todavía no seleccionaste ningún remito para este pago.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="hidden gap-3 px-1 text-xs font-semibold text-stone-500 sm:grid sm:grid-cols-[1fr_150px_32px]">
                <span>Remito</span>
                <span>Monto a imputar</span>
                <span />
              </div>

              {remitosAplicados.map((r) => {
                const monto = parseFloat(r.montoImputado) || 0;
                const excedido = monto > r.saldoPendiente;
                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-1 items-center gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_150px_32px] sm:p-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-800">{r.nroRemito}</span>
                        {r.saldoPendiente < r.total && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            PARCIAL
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">
                        {r.fecha} {r.nroFactura ? `· ${r.nroFactura}` : "· Sin factura"} · saldo{" "}
                        {formatoMoneda(r.saldoPendiente)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className={
                          "flex items-center gap-1 rounded-lg border bg-stone-100 px-2 focus-within:bg-white focus-within:outline-2 focus-within:outline-amber-500 " +
                          (excedido ? "border-red-400 bg-red-50" : "border-stone-200")
                        }
                      >
                        <span className="text-stone-400">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={r.saldoPendiente}
                          value={r.montoImputado}
                          onChange={(e) => actualizarMontoImputado(r.id, e.target.value)}
                          className="w-full bg-transparent py-2 text-sm text-stone-800 outline-none"
                        />
                      </div>
                      {excedido && <span className="text-xs text-red-600">Supera el saldo</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => quitarRemito(r.id)}
                      title="Quitar remito"
                      className="flex h-9 w-9 items-center justify-center justify-self-end rounded-lg text-red-600 hover:bg-red-50 sm:justify-self-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Saldo en vivo */}
          <div
            className={
              "mt-4 flex items-center justify-between rounded-lg px-4 py-3.5 " +
              (saldoSinAplicar > 0
                ? "bg-sky-50 text-sky-800"
                : saldoSinAplicar < 0
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700")
            }
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wallet size={16} />
              {saldoSinAplicar > 0
                ? "Saldo restante a favor del cliente"
                : saldoSinAplicar < 0
                ? "Te pasaste del total recibido"
                : "Todo el pago quedó aplicado"}
            </div>
            <span className="text-xl font-bold">{formatoMoneda(saldoSinAplicar)}</span>
          </div>
        </section>

        {/* Datos generales */}
        <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-base font-bold text-stone-900">Datos generales</h2>

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