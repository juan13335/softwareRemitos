export default function EstadoRemito({ estado }) {
  const config = {
    cobrado: {
      label: "Cobrado",
      clase: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    parcial: {
      label: "Parcial",
      clase: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    pendiente: {
      label: "Pendiente",
      clase: "bg-stone-100 text-stone-600 border border-stone-200",
    },
  };

  const actual = config[estado?.toLowerCase()] || config.pendiente;

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${actual.clase}`}
    >
      {actual.label}
    </span>
  );
}