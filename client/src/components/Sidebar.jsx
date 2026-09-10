import { NavLink } from "react-router-dom";
import { Home, Users, Package, CreditCard, FileText } from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: Users, label: "Socios", path: "/socios" },
  { icon: Package, label: "Remitos", path: "/remitos/nuevo" },
  { icon: CreditCard, label: "Pagos", path: "/pagos" },
  { icon: FileText, label: "Productos", path: "/productos" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col bg-slate-900 py-6 text-slate-300 min-h-screen">
      <div className="mb-5 border-b border-slate-700 px-6 pb-5">
        <div className="text-lg font-bold text-white">Gestion de Remitos</div>
        <div className="mt-0.5 text-sm text-slate-400">Panel de control</div>
      </div>

      <nav className="flex flex-col">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 border-l-4 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? "border-amber-500 bg-slate-700 font-semibold text-white"
                  : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}