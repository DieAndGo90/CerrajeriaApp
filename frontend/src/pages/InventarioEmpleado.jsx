import { useEffect, useState } from "react";
import { apiFetch } from "../apiFetch";
import "./ProductosEstado.css";
import { EstadoStock, FiltroStock } from "./StockInventario";
import { coincideFiltroStock, etiquetaEstadoStock } from "./stockInventarioUtils";
import { crearLibro, crearHoja, descargarExcel } from "../utils/excel";

const API_URL = "http://localhost:8080/operativo/productos";

export default function InventarioEmpleado() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [idCambiandoEstado, setIdCambiandoEstado] = useState(null);
  const [idEditando, setIdEditando] = useState(null);

  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [precio, setPrecio] = useState("");

  async function cargarProductos() {
    try {
      const respuesta = await apiFetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No se pudo cargar el inventario");
      }

      const datos = await respuesta.json();
      setProductos(datos);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    apiFetch(API_URL)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el inventario");
        }
        return respuesta.json();
      })
      .then((datos) => {
        setProductos(datos);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  function limpiarFormulario() {
    setNombre("");
    setStock("");
    setStockMinimo("0");
    setPrecio("");
    setIdEditando(null);
  }

  function prepararEdicion(producto) {
    setIdEditando(producto.id);
    setNombre(producto.nombre);
    setStock(String(producto.stock));
    setStockMinimo(String(producto.stockMinimo ?? 0));
    setPrecio(String(producto.precio));
    setError("");
    setMensaje("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardarProducto(e) {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    const editando = idEditando !== null;

    const datos = {
      nombre: nombre.trim(),
      stock: Number(stock),
      stockMinimo: Number(stockMinimo),
      precio: Number(precio),
    };

    try {
      const url = editando ? `${API_URL}/${idEditando}` : API_URL;

      const respuesta = await apiFetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => ({}));
        throw new Error(
          detalle.error ||
            Object.values(detalle).join(". ") ||
            "No se pudo guardar el producto",
        );
      }

      limpiarFormulario();
      await cargarProductos();

      setMensaje(
        editando
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarProducto(producto) {
    const confirmar = window.confirm(
      `¿Eliminar el producto "${producto.nombre}"?`,
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      const respuesta = await apiFetch(`${API_URL}/${producto.id}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => ({}));

        throw new Error(detalle.error || "No se pudo eliminar el producto");
      }

      await cargarProductos();
      setMensaje("Producto eliminado correctamente.");
    } catch (err) {
      setError(err.message);
    }
  }

  // Cambiar el estado usando la API operativa, sin exponer costos.
  async function cambiarEstadoProducto(producto) {
    if (idCambiandoEstado !== null || typeof producto.activo !== "boolean")
      return;

    const activar = !producto.activo;
    const accion = activar ? "activar" : "desactivar";

    if (
      !activar &&
      !window.confirm(
        `¿Desactivar "${producto.nombre}"? Conservará su stock e historial, pero no admitirá nuevos movimientos.`,
      )
    )
      return;

    setIdCambiandoEstado(producto.id);
    setError("");
    setMensaje("");

    try {
      const respuesta = await apiFetch(`${API_URL}/${producto.id}/${accion}`, {
        method: "PATCH",
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => ({}));
        throw new Error(detalle.error || `No se pudo ${accion} el producto.`);
      }

      const actualizado = await respuesta.json();
      setProductos((anteriores) =>
        anteriores.map((p) => (p.id === actualizado.id ? actualizado : p)),
      );
      setMensaje(
        `Producto ${activar ? "activado" : "desactivado"} correctamente.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIdCambiandoEstado(null);
    }
  }

  async function exportarInventario() {
    try {
      const libro = crearLibro();

      crearHoja(
        libro,
        "Inventario operativo",
        [
          { header: "ID", key: "id", width: 12 },
          { header: "Producto", key: "nombre", width: 40 },
          { header: "Stock", key: "stock", width: 15 },
          { header: "Estado producto", key: "estado", width: 18 },
          { header: "Stock mínimo", key: "stockMinimo", width: 16 },
          { header: "Estado stock", key: "estadoStock", width: 18 },
          {
            header: "Precio de venta",
            key: "precio",
            width: 22,
            style: { numFmt: '"$"#,##0.00' },
          },
        ],
        productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          stock: p.stock,
          stockMinimo: p.stockMinimo ?? 0,
          estadoStock: etiquetaEstadoStock(p),
          estado:
            p.activo === true
              ? "Activo"
              : p.activo === false
                ? "Inactivo"
                : "Sin informar",
          precio: Number(p.precio),
        })),
      );

      await descargarExcel(libro, "inventario-operativo");
    } catch {
      setError("No se pudo exportar el inventario.");
    }
  }

  const productosFiltrados = productos.filter((producto) => {
    const coincideNombre = producto.nombre
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());

    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && producto.activo === true) ||
      (filtroEstado === "inactivos" && producto.activo === false);

    return (
      coincideNombre &&
      coincideEstado &&
      coincideFiltroStock(producto, filtroStock)
    );
  });

  return (
    <main className="contenido-principal">
      <div className="contenido-header">
        <h2>Inventario</h2>
        <p>Inventario y precios de venta.</p>
      </div>

      {error && (
        <div className="mensaje-error">
          <p>{error}</p>
        </div>
      )}

      {mensaje && (
        <div className="mensaje-exito">
          <p>{mensaje}</p>
        </div>
      )}

      <form className="producto-formulario" onSubmit={guardarProducto}>
        <div className="formulario-encabezado">
          <h3>{idEditando !== null ? "Editar producto" : "Nuevo producto"}</h3>
        </div>

        <div className="form-grid">
          <div className="campo-formulario">
            <label htmlFor="nombre-op">Nombre</label>
            <input
              id="nombre-op"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="campo-formulario">
            <label htmlFor="stock-op">Stock</label>
            <input
              id="stock-op"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              readOnly={idEditando !== null}
              required
            />
            {idEditando !== null && (
              <small>Modificá el stock desde Movimientos.</small>
            )}
          </div>

          <div className="campo-formulario">
            <label htmlFor="stock-minimo-op">Stock mínimo</label>
            <input
              id="stock-minimo-op"
              type="number"
              min="0"
              step="1"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              required
            />
            <small>Al alcanzar este nivel se genera una alerta.</small>
          </div>

          <div className="campo-formulario">
            <label htmlFor="precio-op">Precio de venta</label>
            <input
              id="precio-op"
              type="number"
              min="0.01"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-acciones">
          {idEditando !== null && (
            <button
              type="button"
              className="btn-cancelar-edicion"
              onClick={limpiarFormulario}
            >
              Cancelar
            </button>
          )}

          <button type="submit" className="btn-primario" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : idEditando !== null
                ? "Guardar cambios"
                : "Crear producto"}
          </button>
        </div>
      </form>

      <div className="tabla-card">
        <div className="tabla-encabezado">
          <div>
            <h3>Inventario</h3>
            <p>Productos y existencias.</p>
          </div>

          <span className="tabla-contador">
            {productosFiltrados.length} productos
          </span>

          <button
            type="button"
            className="dashboard-actualizar"
            onClick={exportarInventario}
          >
            Exportar Excel
          </button>
        </div>

        <div className="historial-filtros">
          <label htmlFor="buscar-op">Buscar producto</label>
          <input
            id="buscar-op"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: Candado"
          />
        </div>

        <div className="producto-filtro-estado">
          <label htmlFor="estado-op">Mostrar:</label>
          <select
            id="estado-op"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los productos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
          <FiltroStock valor={filtroStock} onChange={setFiltroStock} />
          <span className="producto-filtro-ayuda">
            El filtro también se aplica a la búsqueda por nombre.
          </span>
        </div>

        {cargando ? (
          <p>Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <div className="estado-vacio">
            <h3>No se encontraron productos</h3>
            <p>No hay productos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="tabla-responsive">
            <table className="productos-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Stock</th>
                  <th>Stock mínimo</th>
                  <th>Precio de venta</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr
                    key={producto.id}
                    className={
                      producto.activo === false ? "producto-fila-inactiva" : ""
                    }
                  >
                    <td>{producto.id}</td>
                    <td>{producto.nombre}</td>
                    <td>
                      <span
                        className={`producto-estado-insignia ${
                          producto.activo === true
                            ? "producto-estado-activo"
                            : "producto-estado-inactivo"
                        }`}
                      >
                        {producto.activo === true
                          ? "Activo"
                          : producto.activo === false
                            ? "Inactivo"
                            : "Sin informar"}
                      </span>
                    </td>
                    <td>
                      <EstadoStock producto={producto} />
                    </td>
                    <td>{producto.stockMinimo ?? 0}</td>
                    <td>
                      $
                      {Number(producto.precio).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <div className="acciones">
                        <button
                          type="button"
                          className="btn-editar"
                          onClick={() => prepararEdicion(producto)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={`producto-boton-estado ${
                            producto.activo
                              ? "producto-boton-desactivar"
                              : "producto-boton-activar"
                          }`}
                          disabled={
                            idCambiandoEstado !== null ||
                            guardando ||
                            typeof producto.activo !== "boolean"
                          }
                          onClick={() => cambiarEstadoProducto(producto)}
                        >
                          {idCambiandoEstado === producto.id
                            ? "Guardando..."
                            : producto.activo
                              ? "Desactivar"
                              : "Activar"}
                        </button>

                        <button
                          type="button"
                          className="btn-eliminar"
                          onClick={() => eliminarProducto(producto)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
