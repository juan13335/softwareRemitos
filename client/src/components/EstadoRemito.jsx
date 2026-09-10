export default function EstadoRemito({ estado }) {
  const esCobrado = estado === "cobrado";
  return (
    <span
      className={
        "inline-block rounded-full px-2.5 py-1 text-xs font-bold " +
        (esCobrado ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
      }
    >
      {esCobrado ? "Cobrado" : "Pendiente"}
    </span>
  );
}