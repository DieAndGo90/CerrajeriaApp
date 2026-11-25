import "./StockInventario.css";
import { obtenerEstadoStock, etiquetaEstadoStock } from "./stockInventarioUtils";

export function EstadoStock({ producto }) {
  const estado = obtenerEstadoStock(producto);

  return (
    <div className="inventario-stock-celda">
      <strong>{producto.stock} u.</strong>
      <span className={`inventario-stock-badge inventario-stock-${estado}`}>
        {etiquetaEstadoStock(producto)}
      </span>
    </div>
  );
}

export function FiltroStock({ valor, onChange }) {
  return (
    <>
      <label htmlFor="filtro-nivel-stock">Nivel de stock:</label>
      <select
        id="filtro-nivel-stock"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="todos">Todos los niveles</option>
        <option value="alertas">Requieren reposición</option>
        <option value="normal">Stock normal</option>
        <option value="bajo">Stock bajo</option>
        <option value="agotado">Sin stock</option>
      </select>
    </>
  );
}
