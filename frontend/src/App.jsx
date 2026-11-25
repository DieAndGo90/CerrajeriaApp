import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Productos from "./pages/Productos";
import Movimientos from "./pages/Movimientos";
import Dashboard from "./pages/Dashboard";
import ActualizacionPrecios from "./pages/ActualizacionPrecios";
import "./App.css";

function App() {
  const [paginaActual, setPaginaActual] = useState("productos");

  return (
    <div className="app-layout">
      <Sidebar paginaActual={paginaActual} cambiarPagina={setPaginaActual} />

      {paginaActual === "dashboard" ? (
        <Dashboard />
      ) : paginaActual === "productos" ? (
        <Productos />
      ) : paginaActual === "precios" ? (
        <ActualizacionPrecios />
      ) : (
        <Movimientos />
      )}
    </div>
  );
}

export default App;
