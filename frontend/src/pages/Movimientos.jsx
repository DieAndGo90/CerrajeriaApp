import { useEffect, useState } from "react";

const API_URL = "http://localhost:8080/productos";

function Movimientos() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [observacion, setObservacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensajeRegistro, setMensajeRegistro] = useState("");
  const [errorRegistro, setErrorRegistro] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // CARGAR PRODUCTOS DEL BACKEND
  useEffect(() => {
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
  }, []);

  // CARGAR HISTORIAL DE MOVIMIENTOS
  useEffect(() => {
    fetch("http://localhost:8080/movimientos")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los movimientos");
        }

        return respuesta.json();
      })
      .then((datos) => {
        setMovimientos(datos);
      })
      .catch((error) => {
        console.error("Error al cargar movimientos:", error);
      });
  }, []);

  const registrarMovimiento = async () => {
    const unidades = Number(cantidad);

    // VALIDAR LOS DATOS
    if (!productoId || !tipo || !Number.isInteger(unidades) || unidades <= 0) {
      setErrorRegistro("Completá los datos con una cantidad válida.");
      return;
    }

    const productoSeleccionado = productos.find(
      (producto) => producto.id === Number(productoId),
    );

    if (
      tipo === "SALIDA" &&
      productoSeleccionado &&
      unidades > Number(productoSeleccionado.stock)
    ) {
      setErrorRegistro(
        `Stock insuficiente. Disponibles: ${productoSeleccionado.stock} unidades.`,
      );
      return;
    }

    setGuardando(true);
    setErrorRegistro("");
    setMensajeRegistro("");

    const movimiento = {
      productoId: Number(productoId),
      tipo: tipo,
      cantidad: unidades,
      observacion: observacion.trim(),
    };

    try {
      const respuesta = await fetch("http://localhost:8080/movimientos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(movimiento),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }

      // OBTENER EL MOVIMIENTO REGISTRADO
      const movimientoRegistrado = await respuesta.json();

      // ACTUALIZAR EL HISOTRIAL
      setMovimientos((anteriores) => [movimientoRegistrado, ...anteriores]);
      setMensajeRegistro("Movimiento registrado correctamente.");

      // LIMPIAR LOS CAMPOS
      setProductoId("");
      setTipo("");
      setCantidad("");
      setObservacion("");

      // ACTUALIZAR EL STOCK MOSTRADO
      try {
        const respuestaProductos = await fetch(API_URL);

        if (respuestaProductos.ok) {
          const datos = await respuestaProductos.json();
          setProductos(datos);
        }
      } catch (error) {
        console.error("No se pudo actualizar el listado:", error);
      }
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      setErrorRegistro("No se pudo registrar el movimiento.");
    } finally {
      setGuardando(false);
    }
  };

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const coincideTipo =
      filtroTipo === "TODOS" || movimiento.tipo === filtroTipo;

    const coincideProducto = movimiento.productoNombre
      .toLowerCase()
      .includes(busquedaProducto.trim().toLowerCase());

    return coincideTipo && coincideProducto;
  });

  return (
    <main className="contenido-principal">
      <div className="contenido-header">
        <h2>Movimientos de Stock</h2>
        <p>Registrá entradas y salidas de productos.</p>
      </div>

      <div className="producto-formulario movimiento-formulario">
        <div className="formulario-encabezado">
          <h3>Nuevo movimiento</h3>
          <p>Seleccioná un producto del inventario.</p>
        </div>

        <div className="campo-formulario">
          <label htmlFor="producto">Producto</label>

          {loading && <p>Cargando productos...</p>}

          {error && <p className="mensaje-error">{error}</p>}

          {!loading && !error && (
            <select
              id="producto"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
            >
              <option value="">Seleccionar producto</option>

              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} - Stock: {producto.stock}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-grid">
          <div className="campo-formulario">
            <label htmlFor="tipo">Tipo de movimiento</label>

            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Seleccionar tipo</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </div>

          <div className="campo-formulario">
            <label htmlFor="cantidad">Cantidad</label>

            <input
              type="number"
              id="cantidad"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 5"
            />
          </div>
        </div>

        <div className="campo-formulario">
          <label htmlFor="observacion">Observación (opcional)</label>

          <input
            type="text"
            id="observacion"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: Compra a proveedor"
          />
        </div>

        <div className="form-acciones">
          <button
            type="button"
            className="btn-primario"
            onClick={registrarMovimiento}
            disabled={guardando}
          >
            {guardando ? "Registrando..." : "Registrar movimiento"}
          </button>
        </div>

        {mensajeRegistro && (
          <div className="mensaje-exito">
            <span>✓</span>
            <p>{mensajeRegistro}</p>
          </div>
        )}

        {errorRegistro && (
          <div className="mensaje-error">
            <p>{errorRegistro}</p>
          </div>
        )}
      </div>

      <div className="tabla-card">
        <div className="tabla-encabezado">
          <div>
            <h3>Historial de movimientos</h3>
            <p>Entradas y salidas registradas en el inventario.</p>
          </div>

          <span className="tabla-contador">
            {movimientosFiltrados.length} de {movimientos.length} movimientos
          </span>
        </div>

        <div className="historial-filtros">
          <label htmlFor="filtroTipo">Filtrar por tipo</label>

          <select
            id="filtroTipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos los movimientos</option>
            <option value="ENTRADA">Solo entradas</option>
            <option value="SALIDA">Solo salidas</option>
          </select>

          <div className="filtro-producto">
            <label htmlFor="busquedaProducto">Buscar producto</label>

            <input
              type="text"
              id="busquedaProducto"
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              placeholder="Ej: Candado"
            />
          </div>
        </div>

        {movimientosFiltrados.length === 0 ? (
          <div className="estado-vacio">
            <h3>No hay movimientos para mostrar</h3>
            <p>
              {movimientos.length === 0
                ? "Todavía no se registraron entradas ni salidas."
                : "No hay movimientos que coincidan con el filtro seleccionado."}
            </p>
          </div>
        ) : (
          <div className="tabla-responsive">
            <table className="productos-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Observación</th>
                </tr>
              </thead>

              <tbody>
                {[...movimientosFiltrados]
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>
                        {new Date(movimiento.fecha).toLocaleString("es-AR")}
                      </td>

                      <td>{movimiento.productoNombre}</td>

                      <td>
                        <span
                          className={`movimiento-badge ${
                            movimiento.tipo === "ENTRADA"
                              ? "movimiento-entrada"
                              : "movimiento-salida"
                          }`}
                        >
                          {movimiento.tipo === "ENTRADA"
                            ? "+ Entrada"
                            : "− Salida"}
                        </span>
                      </td>

                      <td>{movimiento.cantidad}</td>

                      <td>{movimiento.observacion?.trim() || "—"}</td>
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

export default Movimientos;
