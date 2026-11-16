import { useEffect, useState } from "react";
import "../App.css";
import { crearLibro, crearHoja, descargarExcel } from "../utils/excel";

const API_URL = "http://localhost:8080/productos";

function Productos() {
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
  const [costoCompra, setCostoCompra] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");

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
      costoCompra: costoCompra === "" ? null : Number(costoCompra),
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
    setCostoCompra(producto.costoCompra ?? "");
  };

  const limpiarFormulario = () => {
    setNombre("");
    setStock("");
    setPrecio("");
    setCostoCompra("");
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
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          const datosError = await respuesta.json().catch(() => ({}));

          throw new Error(
            datosError.error || "No se pudo eliminar el producto.",
          );
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
        setError(error.message);
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

  // EXPORTAR INVENTARIO COMPLETO A EXCEL
  const exportarInventarioExcel = async () => {
    if (exportandoExcel) return;

    setExportandoExcel(true);
    setErrorExportacion("");

    try {
      // Consultar todo el inventario, no solo los resultados de la búsqueda.
      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No se pudo consultar el inventario.");
      }

      const inventario = await respuesta.json();

      if (!Array.isArray(inventario)) {
        throw new Error("La API no devolvió una lista de productos.");
      }

      const workbook = crearLibro();
      const formatoMoneda = '"$"#,##0.00;[Red]-"$"#,##0.00';
      const formatoPorcentaje = "0.00%";

      // Redondear los importes monetarios a centavos antes de acumularlos.
      const aCentavos = (valor) => Math.round(Number(valor) * 100);

      const filas = inventario.map((producto) => {
        const cantidad = Number(producto.stock);
        const precioCentavos = aCentavos(producto.precio);
        const tieneCosto = producto.costoCompra != null;
        const costoCentavos = tieneCosto
          ? aCentavos(producto.costoCompra)
          : null;

        const costoTotal = tieneCosto ? cantidad * costoCentavos : null;
        const valorVenta = cantidad * precioCentavos;

        const gananciaPotencial = tieneCosto ? valorVenta - costoTotal : null;

        return {
          id: producto.id,
          nombre: producto.nombre,
          stock: cantidad,
          estado: cantidad === 0 ? "Sin stock" : "Disponible",
          costo: tieneCosto ? costoCentavos / 100 : null,
          precio: precioCentavos / 100,
          ganancia:
            producto.gananciaBruta != null
              ? Number(producto.gananciaBruta)
              : null,
          margen:
            producto.margenPorcentaje != null
              ? Number(producto.margenPorcentaje) / 100
              : null,
          costoTotal: tieneCosto ? costoTotal / 100 : null,
          valorVenta: valorVenta / 100,
          gananciaPotencial: tieneCosto ? gananciaPotencial / 100 : null,
          estadoCosto: tieneCosto ? "Registrado" : "Sin registrar",
        };
      });

      const columnaMoneda = (header, key, width = 22) => ({
        header,
        key,
        width,
        style: { numFmt: formatoMoneda },
      });

      // HOJA 1: INVENTARIO
      crearHoja(
        workbook,
        "Inventario",
        [
          { header: "ID", key: "id", width: 10 },
          { header: "Producto", key: "nombre", width: 38 },
          { header: "Stock", key: "stock", width: 12 },
          { header: "Estado stock", key: "estado", width: 18 },
          columnaMoneda("Costo unitario", "costo"),
          columnaMoneda("Precio de venta", "precio"),
          columnaMoneda("Ganancia bruta/u.", "ganancia"),
          {
            header: "Margen bruto",
            key: "margen",
            width: 18,
            style: { numFmt: formatoPorcentaje },
          },
          columnaMoneda("Costo total stock", "costoTotal"),
          columnaMoneda("Venta potencial", "valorVenta"),
          columnaMoneda("Ganancia potencial", "gananciaPotencial", 25),
          { header: "Estado costo", key: "estadoCosto", width: 20 },
        ],
        filas,
      );

      // HOJA 2: RESUMEN ECONÓMICO
      const conCosto = filas.filter((fila) => fila.costoTotal != null);
      const sinCosto = filas.length - conCosto.length;

      const sumarImportes = (lista, clave) =>
        lista.reduce((total, fila) => total + aCentavos(fila[clave]), 0) / 100;

      const totalCosto = sumarImportes(conCosto, "costoTotal");
      const totalVenta = sumarImportes(filas, "valorVenta");
      const ventaConCosto = sumarImportes(conCosto, "valorVenta");
      const gananciaConCosto = sumarImportes(conCosto, "gananciaPotencial");

      const indicadores = [
        {
          indicador: "Fecha del reporte",
          valor: new Date().toLocaleString("es-AR", {
            hour12: false,
          }),
          detalle: "Inventario completo al momento de la consulta.",
        },
        {
          indicador: "Productos registrados",
          valor: filas.length,
          detalle: "Cantidad de productos diferentes.",
        },
        {
          indicador: "Unidades en stock",
          valor: filas.reduce((total, fila) => total + fila.stock, 0),
          detalle: "Suma de las existencias actuales.",
        },
        {
          indicador: "Productos agotados",
          valor: filas.filter((fila) => fila.stock === 0).length,
          detalle: "Productos con stock igual a cero.",
        },
        {
          indicador: "Productos con costo registrado",
          valor: conCosto.length,
          detalle: "Incluye productos con costo igual a cero.",
        },
        {
          indicador: "Productos sin costo registrado",
          valor: sinCosto,
          detalle: "No se consideran en el cálculo de rentabilidad.",
        },
        {
          indicador: "Cobertura de costos",
          valor: filas.length ? conCosto.length / filas.length : null,
          detalle: "Proporción de productos con costo registrado.",
          formato: formatoPorcentaje,
        },
        {
          indicador: "Valor del inventario a costo registrado",
          valor: conCosto.length ? totalCosto : null,
          detalle: sinCosto
            ? "Valor parcial: faltan costos de compra."
            : "Costo de las existencias actuales.",
          formato: formatoMoneda,
        },
        {
          indicador: "Valor potencial de venta (todo)",
          valor: totalVenta,
          detalle: "Stock por precio de venta actual de todos los productos.",
          formato: formatoMoneda,
        },
        {
          indicador: "Venta potencial con costo registrado",
          valor: conCosto.length ? ventaConCosto : null,
          detalle: "Solo productos con costo conocido.",
          formato: formatoMoneda,
        },
        {
          indicador: "Ganancia bruta potencial",
          valor: conCosto.length ? gananciaConCosto : null,
          detalle:
            "Solo productos con costo conocido. No es ganancia realizada.",
          formato: formatoMoneda,
        },
        {
          indicador: "Margen bruto potencial",
          valor:
            conCosto.length && ventaConCosto !== 0
              ? gananciaConCosto / ventaConCosto
              : null,
          detalle: "Ganancia potencial / venta potencial del mismo conjunto.",
          formato: formatoPorcentaje,
        },
      ];

      const resumen = crearHoja(
        workbook,
        "Resumen económico",
        [
          { header: "Indicador", key: "indicador", width: 48 },
          { header: "Valor", key: "valor", width: 27 },
          { header: "Descripción", key: "detalle", width: 78 },
        ],
        indicadores,
      );

      // Cada indicador conserva su formato numérico correspondiente.
      indicadores.forEach((indicador, indice) => {
        if (indicador.formato) {
          resumen.getCell(indice + 2, 2).numFmt = indicador.formato;
        }
      });

      // El resumen no necesita filtros; el inventario sí.
      resumen.autoFilter = undefined;

      const fecha = new Date();
      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");

      await descargarExcel(workbook, `inventario-${anio}-${mes}-${dia}`);
    } catch (error) {
      console.error("Error al exportar inventario:", error);
      setErrorExportacion("No se pudo generar el reporte de inventario.");
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
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
              readOnly={idEditando !== null}
              required
            />

            {idEditando !== null && (
              <small>El stock se modifica desde Movimientos de Stock.</small>
            )}
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

          <div className="campo-formulario">
            <label>Costo de compra</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costoCompra}
              onChange={(e) => setCostoCompra(e.target.value)}
              placeholder="Ej: 9000"
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

      {errorExportacion && (
        <div className="mensaje-error" role="alert">
          <p>{errorExportacion}</p>
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
            <button
              type="button"
              className="dashboard-actualizar"
              onClick={exportarInventarioExcel}
              disabled={exportandoExcel}
              style={{ marginTop: 0 }}
            >
              {exportandoExcel ? "Exportando..." : "Exportar inventario Excel"}
            </button>
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
                    <th>Costo de compra</th>
                    <th>Ganancia bruta</th>
                    <th>Margen (%)</th>
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
                          {producto.stock === 0 ? "Sin stock" : producto.stock}
                        </span>
                      </td>
                      <td>
                        ${Number(producto.precio).toLocaleString("es-AR")}
                      </td>
                      <td>
                        {producto.costoCompra != null
                          ? `$${Number(producto.costoCompra).toLocaleString("es-AR")}`
                          : "Sin registrar"}
                      </td>
                      <td>
                        {producto.gananciaBruta != null
                          ? `$${Number(producto.gananciaBruta).toLocaleString("es-AR")}`
                          : "Sin calcular"}
                      </td>
                      <td>
                        {producto.margenPorcentaje != null
                          ? `${Number(producto.margenPorcentaje).toLocaleString(
                              "es-AR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}%`
                          : "Sin calcular"}
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
  );
}

export default Productos;
