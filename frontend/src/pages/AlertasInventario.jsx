import { useEffect, useState } from "react";
import { apiFetch } from "../apiFetch";
import { EstadoStock } from "./StockInventario";
import { obtenerEstadoStock } from "./stockInventarioUtils";

// Vista compartida: recibe exclusivamente los datos necesarios para reponer.
export function AlertasInventario({ productos }) {
  const alertas = productos.filter((p) => {
    const estado = obtenerEstadoStock(p);
    return p.activo === true && (estado === "agotado" || estado === "bajo");
  }).sort((a, b) => Number(a.stock !== 0) - Number(b.stock !== 0) || a.nombre.localeCompare(b.nombre, "es"));

  const agotados = alertas.filter((p) => p.stock === 0).length;
  const bajos = alertas.length - agotados;

  return (
    <section className="tabla-card" aria-label="Alertas de inventario">
      <div className="tabla-encabezado">
        <div>
          <h3>Alertas de inventario</h3>
          <p>Productos activos que requieren reposición. Agotados primero.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="inventario-stock-badge inventario-stock-agotado">
            {agotados} sin stock
          </span>
          <span className="inventario-stock-badge inventario-stock-bajo">
            {bajos} con stock bajo
          </span>
          <span className="tabla-contador">{alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}</span>
        </div>
      </div>
      {alertas.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay productos activos que requieran reposición.</p>
        </div>
      ) : (
        <div className="tabla-responsive">
          <table className="productos-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock actual y estado</th>
                <th>Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((producto) => (
                <tr key={producto.id} className={producto.stock === 0 ? "alerta-fila-agotada" : "alerta-fila-baja"}>
                  <td>{producto.nombre}</td>
                  <td><EstadoStock producto={producto} /></td>
                  <td>{producto.stockMinimo ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// El empleado consulta únicamente el endpoint operativo, no /productos.
export function PanelAlertasEmpleado() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    apiFetch("http://localhost:8080/operativo/productos/alertas-stock")
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudieron cargar las alertas.");
        return respuesta.json();
      })
      .then((datos) => {
        if (!Array.isArray(datos)) throw new Error("Respuesta de alertas inválida.");
        if (vigente) setProductos(datos);
      })
      .catch(() => {
        if (vigente) setError("No se pudieron cargar las alertas de inventario.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, [recarga]);

  function actualizar() {
    setCargando(true);
    setError("");
    setRecarga((valor) => valor + 1);
  }

  return (
    <main className="contenido-principal dashboard-page">
      <div className="contenido-header">
        <h2>Alertas de inventario</h2>
        <p>Consultá los productos que necesitan reposición.</p>
        <button type="button" className="dashboard-actualizar" onClick={actualizar} disabled={cargando}>
          {cargando ? "Actualizando..." : "Actualizar datos"}
        </button>
      </div>
      {cargando && <p>Cargando alertas...</p>}
      {error && <div className="mensaje-error" role="alert">{error}</div>}
      {!cargando && !error && <AlertasInventario productos={productos} />}
    </main>
  );
}
