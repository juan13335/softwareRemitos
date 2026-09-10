import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/dashboard.jsx";
import CargarRemito from "./pages/CargarRemito.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-stone-100 text-stone-800">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/remitos/nuevo" element={<CargarRemito />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}