import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, Package, CreditCard, Plus, Check, Clock, Calendar, Loader2, Eye, Wallet } from "lucide-react";
import TablaRemitos from "../components/TablaRemitos.jsx";
import Paginador from "../components/Paginador.jsx";
import BarraPagoRemitos from "../components/BarraPagoRemitos.jsx";
import api from "../api/api.js";


const QUICK_ACTIONS = [
  { label: "Cargar nuevo remito", icon: Plus, path: "/remitos/nuevo" },
  { label: "Registrar pago", icon: CreditCard, path: "/pagos/nuevo" },
  { label: "Agregar socio", icon: Users, path: "/socios/nuevo" },
];

export default function Dashboard() {
  const [remitos, setRemitos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totales, setTotales] = useState({
    "total_pendiente": 0,
    "total_cobrado": 0,
  })
  const [paginacion, setPaginacion] = useState(null);
  const [saldoAFavor, setSaldoAFavor] = useState(0);
  const [socioId, setSocioId] = useState("");
  const [socios, setSocios] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRemitos = async () => {
      try {
        const res = await api.get("/remitos", {
          params: { page: pagina, limit: 10 },
        });
        setRemitos(res.data.datos);
        setPaginacion(res.data.paginacion);
        if (res.data.totales) {
          setTotales(res.data.totales);
        }
      } catch (err) {
        console.error("Error al cargar remitos:", err);
        setError("No se pudieron cargar los comprobantes.");
      } finally {
        setCargando(false);
      }
    };

    fetchRemitos();
  }, [pagina]);


  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const res = await api.get("/socios");
        setSocios(res.data);
        if (res.data && res.data.length > 0) {
          setSocioId(String(res.data[0].id));
        }
      } catch (err) {
        console.error("Error al cargar socios:", err);
      }
    };
    fetchSocios();
  }, []);

  useEffect(() => {
    if (!socioId) {
      setSaldoAFavor(0);
      return;
    }

    const fetchSaldoAfavor = async () => {
      try {
        const res = await api.get(`/socios/anticipo/${socioId}`);
        setSaldoAFavor(res.data.saldo_a_favor);
      } catch (err) {
        console.error("Error al cargar saldo a favor:", err);
      }
    };

    fetchSaldoAfavor();
  }, [socioId]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Alternar seleccionar todos
  const todosSeleccionados =
    remitos.length > 0 && seleccionados.length === remitos.length;

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados([]);
    } else {
      setSeleccionados(remitos.map((r) => r.id || r.nro_remito));
    }
  };

  // Suma total acumulada de lo que esté tildado
  const totalSeleccionado = remitos
    .filter((r) => seleccionados.includes(r.id || r.nro_remito))
    .reduce((acc, r) => acc + (Number(r.saldo_pendiente) || 0), 0);

  const formatMoneda = (val) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val || 0);

  const formatFecha = (str) => {
    if (!str) return "—";
    const [y, m, d] = str.split("-");
    return `${d}/${m}/${y}`;
  };

  // 1. Estado de cobro real
  const esCobrado = (r) => {
    const estado = r.estado_cobro_cliente?.toLowerCase();
    return estado === "cobrado";
  };


  // 3. Cantidades
  const cantPendientes = remitos.filter((r) => !esCobrado(r)).length;
  const cantCobrados = remitos.filter((r) => esCobrado(r)).length;

  // 4. KPIs
  const kpis = [
    {
      label: "Total pendiente a pagar",
      value: formatMoneda(totales.total_pendiente),
      delta: `${cantPendientes} ${cantPendientes === 1 ? "remito pendiente" : "remitos pendientes"}`,
      icon: Clock,
      tint: "bg-amber-50 text-amber-700",
    },
    {
      label: "Total transferido",
      value: formatMoneda(totales.total_cobrado),
      delta: `${cantCobrados} ${cantCobrados === 1 ? "remito cobrado" : "remitos cobrados"}`,
      icon: Check,
      tint: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Saldo A Favor",
      value: formatMoneda(saldoAFavor),
      icon: Wallet,
      tint: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-5 md:px-9">
      <div className="mb-6 py-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resumen general</h1>
          <div className="mt-1 text-sm text-stone-500">Estado de cuentas con todos los socios</div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-500">
          <Calendar size={15} />
          Hoy, 09 de septiembre 2026
        </div>
      </div>

      {/* Grid de KPIs (ajustado a 3 columnas en pantallas medianas/grandes) */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(({ label, value, delta, icon: Icon, tint }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className={`mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
              <Icon size={18} />
            </div>
            <div className="mb-1.5 text-sm text-stone-500">{label}</div>
            <div className="text-2xl font-bold text-stone-900">
              {cargando ? "—" : value}
            </div>
            <div className="mt-1.5 text-xs text-stone-500">
              {cargando ? "calculando..." : delta}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-7 flex flex-col gap-3 sm:flex-row">
        {QUICK_ACTIONS.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => path && navigate(path)}
            className="flex flex-1 items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left text-sm font-semibold text-stone-800 hover:border-amber-400 hover:bg-amber-50/40 transition-colors cursor-pointer"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Icon size={17} />
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla de remitos con selección múltiple */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <TablaRemitos
          remitos={remitos}
          cargando={cargando}
          socios={socios}
          onVer={(r) => navigate(`/remitos/detalle/${r.id}`)}
          onEditar={(r) => navigate(`/remitos/editar/${r.id}`)}
         />
        <Paginador
          paginacion={paginacion}
          alCambiarPagina={setPagina}
          cargando={cargando}
          nombreEntidad="remitos"
        />
        {/* Fin del div overflow-x-auto */}
        <BarraPagoRemitos
          seleccionados={seleccionados}
          total={totalSeleccionado}
          formatMoneda={formatMoneda}
          onDesmarcar={() => setSeleccionados([])}
          onPagar={() => {
            console.log("IDs listos para pagar:", seleccionados);
          }}
        />
      </div>
    </main>
  );
}