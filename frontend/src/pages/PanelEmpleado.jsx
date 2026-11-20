import { useState } from "react";
import InventarioEmpleado from "./InventarioEmpleado";
import Movimientos from "./Movimientos";

export default function PanelEmpleado() {
  const [paginaActual, setPaginaActual] = useState("inventario");

  return (
    <div>
      <nav className="menu-empleado">
        <button
          type="button"
          className={paginaActual === "inventario" ? "activo" : ""}
          onClick={() => setPaginaActual("inventario")}
        >
          📦 Inventario
        </button>

        <button
          type="button"
          className={paginaActual === "movimientos" ? "activo" : ""}
          onClick={() => setPaginaActual("movimientos")}
        >
          🔄 Movimientos de Stock
        </button>
      </nav>

      {paginaActual === "inventario" && <InventarioEmpleado />}

      {paginaActual === "movimientos" && <Movimientos />}
    </div>
  );
}
