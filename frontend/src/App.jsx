import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Productos from "./pages/Productos";
import Movimientos from "./pages/Movimientos";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const [paginaActual, setPaginaActual] = useState("dashboard");

  return (
    <div className="app-layout">
      <Sidebar paginaActual={paginaActual} cambiarPagina={setPaginaActual} />

      {paginaActual === "dashboard" ? (
        <Dashboard />
      ) : paginaActual === "productos" ? (
        <Productos />
      ) : (
        <Movimientos />
      )}
    </div>
  );
}

export default App;
