import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Package, User, Calendar, X } from "lucide-react";
import api from "../api/api";
import Paginador from "../components/Paginador";
import TablaRemitos from "../components/TablaRemitos";

function formatoMoneda(valor) {
    const num = Number(valor) || 0;
    return "$ " + Math.round(num).toLocaleString("es-AR");
}

function formatoFecha(fechaIso) {
    if (!fechaIso) return "—";
    const [y, m, d] = fechaIso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
}

export default function ListadoRemitos() {
    const navigate = useNavigate();

    // Estados de datos
    const [remitos, setRemitos] = useState([]);
    const [socios, setSocios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoSocios, setCargandoSocios] = useState(true);

    // Estados de paginación
    const [pagina, setPagina] = useState(1);
    const [paginacion, setPaginacion] = useState(null);

    // Totales globales calculados por la base de datos
    const [totales, setTotales] = useState({
        total_pendiente: 0,
        total_imputado: 0,
    });

    // Filtros
    const [socioId, setSocioId] = useState("todos");
    const [estado, setEstado] = useState("todos");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const hayFiltros = socioId !== "todos" || estado !== "todos" || desde || hasta;


    useEffect(() => {
        async function fetchSocios() {
            try {
                setCargandoSocios(true);
                const res = await api.get("/socios");
                setSocios(res.data?.datos || res.data || []);
            } catch (err) {
                console.error("Error al traer socios:", err);
            } finally {
                setCargandoSocios(false);
            }
        }
        fetchSocios();
    }, []);


    useEffect(() => {
        async function fetchRemitos() {
            try {
                setCargando(true);
                const res = await api.get("/remitos", {
                    params: {
                        page: pagina,
                        limit: 10,
                        socio_id: socioId !== "todos" ? socioId : undefined, // Axios toma undefined como un input vacio 
                        estado: estado !== "todos" ? estado : undefined,
                        desde: desde || undefined,
                        hasta: hasta || undefined,
                    },
                });

                setRemitos(res.data.datos);
                setPaginacion(res.data.paginacion);

                if (res.data.totales) {
                    setTotales(res.data.totales);
                }
            } catch (err) {
                console.error("Error al listar remitos:", err);
            } finally {
                setCargando(false);
            }
        }

        fetchRemitos();
    }, [pagina, socioId, estado, desde, hasta]);

    // Al cambiar cualquier filtro, volvemos a la página 1
    function cambiarFiltro(setter, valor) {
        setter(valor);
        setPagina(1);
    }

    function limpiarFiltros() {
        setSocioId("todos");
        setEstado("todos");
        setDesde("");
        setHasta("");
        setPagina(1);
    }

    function nombreSocio(id, remito) {
        // Si la vista SQL ya trae el nombre del socio, lo usa directamente
        if (remito?.socio_nombre) return remito.socio_nombre;
        return socios.find((s) => s.id === id)?.nombre ?? "—";
    }

    function verRemito(remito) {
        navigate(`/remitos/${remito.id}`);
    }

    function editarRemito(remito) {
        navigate(`/remitos/editar/${remito.id}`);
    }

    async function eliminarRemito(remito) {
        const nro = remito.nro_remito || remito.nroRemito;
        const confirmado = window.confirm(
            `¿Eliminar el remito ${nro}? Esta acción no se puede deshacer.`
        );
        if (!confirmado) return;

        try {
            await api.delete(`/remitos/${remito.id}`);
            // Refrescamos sacándolo del estado actual
            setRemitos((prev) => prev.filter((r) => r.id !== remito.id));
        } catch (err) {
            alert(err.response?.data?.error || "Error al eliminar el remito.");
        }
    }

    return (
        <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-9 text-stone-800">
            <div className="mb-2 text-sm text-stone-500">
                Remitos / <span className="font-semibold text-stone-800">Listado</span>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-stone-900">Remitos</h1>
                <div className="mt-1 text-sm text-stone-500">
                    Entregas cargadas y su estado de cobro
                </div>
            </div>

            {/* Filtros */}
            <section className="mb-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <label className="flex min-w-[150px] flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-sm text-stone-500">
                            <Calendar size={14} /> Desde
                        </span>
                        <input
                            type="date"
                            value={desde}
                            onChange={(e) => cambiarFiltro(setDesde, e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                        />
                    </label>

                    <label className="flex min-w-[150px] flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-sm text-stone-500">
                            <Calendar size={14} /> Hasta
                        </span>
                        <input
                            type="date"
                            value={hasta}
                            onChange={(e) => cambiarFiltro(setHasta, e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                        />
                    </label>

                    <label className="flex min-w-[150px] flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-sm text-stone-500">
                            <User size={14} /> Socio
                        </span>
                        <select
                            value={socioId}
                            disabled={cargandoSocios}
                            onChange={(e) => cambiarFiltro(setSocioId, e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                        >
                            <option value="todos">Todos</option>
                            {socios.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex min-w-[150px] flex-col gap-1.5">
                        <span className="text-sm text-stone-500">Estado</span>
                        <select
                            value={estado}
                            onChange={(e) => cambiarFiltro(setEstado, e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2.5 text-base text-stone-800 focus:bg-white focus:outline-2 focus:outline-amber-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="parcial">Parcial</option>
                            <option value="cobrado">Cobrado</option>
                        </select>
                    </label>

                    {hayFiltros && (
                        <button
                            onClick={limpiarFiltros}
                            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-500 hover:bg-stone-100 cursor-pointer"
                        >
                            <X size={15} />
                            Limpiar
                        </button>
                    )}
                </div>
            </section>

            {/* Resumen Global */}
            <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-stone-100 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-stone-600">
                    <Package size={16} className="shrink-0" />
                    {paginacion?.totalRegistros || 0} remito{paginacion?.totalRegistros !== 1 ? "s" : ""}
                </span>
                <span className="text-stone-600">
                    Total imputado:{" "}
                    <b className="font-semibold text-stone-800">
                        {formatoMoneda(totales.total_cobrado)}
                    </b>
                </span>
                <span className="text-stone-600">
                    Saldo pendiente:{" "}
                    <b className="font-semibold text-amber-700">
                        {formatoMoneda(totales.total_pendiente)}
                    </b>
                </span>
            </div>

            {/* Tabla */}
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <TablaRemitos
                    remitos={remitos}
                    cargando={cargando}
                    socios={socios}
                    onVer={(r) => navigate(`/remitos/detalle/${r.id}`)}
                    onEditar={(r) => navigate(`/remitos/editar/${r.id}`)}
                    onEliminar={eliminarRemito} />

                {/* Paginador integrado */}
                <Paginador
                    paginacion={paginacion}
                    alCambiarPagina={setPagina}
                    cargando={cargando}
                    nombreEntidad="remitos"
                />
            </div>
        </main>
    );
}