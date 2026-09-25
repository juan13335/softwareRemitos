
import { Loader2 } from "lucide-react";

export default function Cargando({ loading = true, nombreEntidad = "datos" }) {
  if (!loading) return null;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center gap-3 px-5 py-8 text-stone-500">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      <span className="text-sm font-medium">
        Cargando {nombreEntidad}...
      </span>
    </main>
  );
}