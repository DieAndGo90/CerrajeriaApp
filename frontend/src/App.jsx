import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Productos from "./pages/Productos";
import Movimientos from "./pages/Movimientos";
import "./App.css";

function App() {
  const [paginaActual, setPaginaActual] = useState("productos");

  return (
    <div className="app-layout">
      <Sidebar paginaActual={paginaActual} cambiarPagina={setPaginaActual} />

      {paginaActual === "productos" ? <Productos /> : <Movimientos />}
    </div>
  );
}

export default App;
