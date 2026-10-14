import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/productos";

function App() {
  // ESTADOS DE LOS PRODUCTOS
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  // ESTADOS DEL FORMULARIO
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("");
  const [precio, setPrecio] = useState("");

  const [mensaje, setMensaje] = useState("");

  // CARGAR PRODUCTOS DEL BACKEND
  useEffect(() => {
    fetch(API_URL)
      .then((respuesta) => respuesta.json())
      .then((datos) => setProductos(datos))
      .catch((error) => {
        console.error("Error al cargar los productos:", error);
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // CREAR NUEVO PRODUCTO
  const guardarProducto = (e) => {
    e.preventDefault();

    const producto = {
      nombre: nombre,
      stock: Number(stock),
      precio: Number(precio),
    };

    const editando = idEditando !== null;

    const url = editando ? `${API_URL}/${idEditando}` : `${API_URL}`;

    const metodo = editando ? "PUT" : "POST";

    setError("");

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo guardar el producto");
        }

        return respuesta.json();
      })
      .then(() => {
        buscarProductos();

        limpiarFormulario();

        setMensaje(
          editando
            ? "Producto actualizado correctamente."
            : "Producto creado correctamente.",
        );

        setTimeout(() => {
          setMensaje("");
        }, 2000);
      })
      .catch((error) => {
        console.error("Error al guardar el producto:", error);

        setError(
          editando
            ? "No se pudo actualizar el producto."
            : "No se pudo crear el producto.",
        );
      });
  };

  // EDITAR PRODUCTO
  const prepararEdicion = (producto) => {
    setIdEditando(producto.id);
    setNombre(producto.nombre);
    setStock(producto.stock);
    setPrecio(producto.precio);
  };

  const limpiarFormulario = () => {
    setNombre("");
    setStock("");
    setPrecio("");
    setIdEditando(null);
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
  };

  // ELIMINAR PRODUCTO
  const eliminarProducto = (id) => {
    setError("");
    fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo eliminar el producto");
        }

        setProductos(productos.filter((producto) => producto.id !== id));
        setProductoAEliminar(null);
        setMensaje("Producto eliminado correctamente.");

        setTimeout(() => {
          setMensaje("");
        }, 2000);
      })
      .catch((error) => {
        console.error("Error al eliminar el producto:", error);

        setProductoAEliminar(null);
        setError("No se pudo eliminar el producto.");
      });
  };

  // BUSCAR PRODUCTOS
  const buscarProductos = (e) => {
    e?.preventDefault();

    const termino = busqueda.trim();

    const url = termino
      ? `${API_URL}/buscar?nombre=${encodeURIComponent(termino)}`
      : `${API_URL}`;

    setLoading(true);
    setError("");

    fetch(url)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo realizar la búsqueda");
        }

        return respuesta.json();
      })
      .then((datos) => {
        setProductos(datos);
      })
      .catch((error) => {
        console.error("Error al buscar productos:", error);
        setError("No se pudieron buscar los productos.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setLoading(true);
    setError("");

    fetch(API_URL)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los productos");
        }

        return respuesta.json();
      })
      .then((datos) => {
        setProductos(datos);
      })
      .catch((error) => {
        console.error("Error al cargar productos:", error);
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🔐</span>
          <h1>CerrajeriaApp</h1>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className="nav-item active">
            Productos
          </button>
        </nav>
      </aside>

      <main className="contenido-principal">
        <div className="contenido-header">
          <h2>Productos</h2>
          <p>Gestión de productos de la cerrajería.</p>
        </div>

        <form className="buscador-formulario" onSubmit={buscarProductos}>
          <div className="buscador-contenido">
            <div>
              <h3>Buscar producto</h3>
              <p>Buscá un producto por su nombre.</p>
            </div>

            <div className="buscador-controles">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej: Yale"
              />

              <button type="submit" className="btn-buscar">
                Buscar
              </button>
              <button
                type="button"
                className="btn-limpiar"
                onClick={limpiarBusqueda}
              >
                Limpiar
              </button>
            </div>
          </div>
        </form>

        {mensaje && (
          <div className="mensaje-exito">
            <span>✓</span>
            <p>{mensaje}</p>
          </div>
        )}

        <form className="producto-formulario" onSubmit={guardarProducto}>
          <div className="formulario-encabezado">
            <h3>{idEditando ? "Editar producto" : "Nuevo producto"}</h3>
            <p>
              {idEditando
                ? "Modificá los datos del producto seleccionado."
                : "Agregá un nuevo producto al inventario."}
            </p>
          </div>

          <div className="form-grid">
            <div className="campo-formulario">
              <label>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Candado Yale"
                required
              />
            </div>

            <div className="campo-formulario">
              <label>Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Ej: 10"
                required
              />
            </div>

            <div className="campo-formulario">
              <label>Precio</label>
              <input
                type="number"
                min="0"
                step="1"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 14500"
                required
              />
            </div>
          </div>

          <div className="form-acciones">
            {idEditando && (
              <button
                type="button"
                className="btn-cancelar-edicion"
                onClick={cancelarEdicion}
              >
                Cancelar
              </button>
            )}

            <button type="submit" className="btn-primario">
              {idEditando ? "Guardar cambios" : "Guardar producto"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="estado-carga">
            <div className="spinner"></div>
            <span>Cargando productos...</span>
          </div>
        )}

        {error && (
          <div className="mensaje-error">
            <span>!</span>

            <div>
              <strong>Ocurrió un problema</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Inventario</h3>
                <p>Productos registrados en el sistema.</p>
              </div>

              <span className="tabla-contador">
                {productos.length}{" "}
                {productos.length === 1 ? "producto" : "productos"}
              </span>
            </div>

            {productos.length === 0 ? (
              <div className="estado-vacio">
                <div className="estado-vacio-icono">⌕</div>

                <h3>No se encontraron productos</h3>

                <p>
                  {busqueda.trim()
                    ? `No hay resultados para "${busqueda}".`
                    : "Todavía no hay productos registrados."}
                </p>
              </div>
            ) : (
              <div className="tabla-responsive">
                <table className="productos-tabla">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Stock</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {productos.map((producto) => (
                      <tr key={producto.id}>
                        <td>{producto.id}</td>
                        <td>{producto.nombre}</td>
                        <td>
                          <span
                            className={
                              producto.stock === 0
                                ? "stock-badge stock-agotado"
                                : "stock-badge stock-disponible"
                            }
                          >
                            {producto.stock === 0
                              ? "Sin stock"
                              : producto.stock}
                          </span>
                        </td>
                        <td>
                          ${Number(producto.precio).toLocaleString("es-AR")}
                        </td>

                        <td>
                          <div className="acciones">
                            <button
                              className="btn-editar"
                              onClick={() => prepararEdicion(producto)}
                            >
                              Editar
                            </button>

                            <button
                              className="btn-eliminar"
                              onClick={() => setProductoAEliminar(producto)}
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
        )}
        {productoAEliminar && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-icono">!</div>

              <h3>Eliminar producto</h3>

              <p>
                ¿Seguro que querés eliminar{" "}
                <strong>{productoAEliminar.nombre}</strong>?
              </p>

              <p className="modal-advertencia">
                Esta acción no se puede deshacer.
              </p>

              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setProductoAEliminar(null)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-confirmar-eliminar"
                  onClick={() => eliminarProducto(productoAEliminar.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
