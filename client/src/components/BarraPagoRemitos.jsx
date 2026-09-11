export default function BarraPagoRemitos({
  seleccionados,
  total,
  formatMoneda,
  onDesmarcar,
  onPagar,
}) {
  if (seleccionados.length === 0) return null;

  return (
    <aside className="sticky bottom-4 mt-4 flex items-center justify-between rounded-xl bg-stone-900 px-5 py-3.5 text-white shadow-xl transition-all">
      <div className="text-sm">
        <span className="font-semibold text-amber-400">{seleccionados.length}</span>{" "}
        {seleccionados.length === 1
          ? "comprobante seleccionado"
          : "comprobantes seleccionados"}{" "}
        por un total de{" "}
        <span className="font-bold text-emerald-400">
          {formatMoneda(total)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDesmarcar}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          Desmarcar todos
        </button>
        <button
          type="button"
          onClick={onPagar}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
        >
          Pagar seleccionados
        </button>
      </div>
    </aside>
  );
}