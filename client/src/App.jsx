import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/dashboard.jsx";
import CargarRemito from "./pages/CargarRemito.jsx";
import DetalleRemito from "./pages/DetalleRemitos.jsx";
import CargarProducto from "./pages/CargarProducto.jsx";
import CargarPago from "./pages/CargarPago.jsx";  

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-stone-100 text-stone-800">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/remitos/nuevo" element={<CargarRemito />} />
          <Route path="/remitos/detalle/:id" element={<DetalleRemito />} /> 
          <Route path="/productos/nuevo" element={<CargarProducto />} />
          <Route path="/pagos/nuevo" element={<CargarPago />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}