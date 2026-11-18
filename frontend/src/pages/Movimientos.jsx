import { useEffect, useState } from "react";
import { crearLibro, crearHoja, descargarExcel } from "../utils/excel";
import { apiFetch } from "../apiFetch";

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
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");

  // CARGAR PRODUCTOS DEL BACKEND
  useEffect(() => {
    apiFetch(API_URL)
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
    apiFetch("http://localhost:8080/movimientos")
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
        setErrorHistorial(
          "No se pudo cargar el historial completo de movimientos.",
        );
      })
      .finally(() => {
        setCargandoHistorial(false);
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
      const respuesta = await apiFetch("http://localhost:8080/movimientos", {
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
        const respuestaProductos = await apiFetch(API_URL);

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

  // EXPORTAR LOS MOVIMIENTOS QUE COINCIDEN CON LOS FILTROS
  const exportarMovimientosExcel = async () => {
    if (
      exportandoExcel ||
      cargandoHistorial ||
      errorHistorial ||
      movimientosFiltrados.length === 0
    )
      return;

    setExportandoExcel(true);
    setErrorExportacion("");

    try {
      const workbook = crearLibro();
      const seleccion = [...movimientosFiltrados].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha),
      );

      // Hoja 1: detalle de los movimientos visibles en el historial.
      const hojaDetalle = crearHoja(
        workbook,
        "Historial de movimientos",
        [
          { header: "ID movimiento", key: "id", width: 17 },
          { header: "Fecha y hora", key: "fecha", width: 24 },
          { header: "ID producto", key: "productoId", width: 16 },
          { header: "Producto", key: "producto", width: 35 },
          { header: "Tipo", key: "tipo", width: 15 },
          { header: "Cantidad", key: "cantidad", width: 15 },
          { header: "Observación", key: "observacion", width: 50 },
        ],
        seleccion.map((movimiento) => {
          // Excel no tiene zona horaria. Conservamos la hora local del backend.
          const fecha = new Date(`${movimiento.fecha.slice(0, 19)}Z`);

          return {
            id: movimiento.id,
            fecha: Number.isNaN(fecha.getTime()) ? movimiento.fecha : fecha,
            productoId: movimiento.productoId,
            producto: movimiento.productoNombre,
            tipo: movimiento.tipo,
            cantidad: Number(movimiento.cantidad),
            observacion: movimiento.observacion ?? "",
          };
        }),
      );

      hojaDetalle.getColumn("fecha").numFmt = "dd/mm/yyyy hh:mm:ss";

      // Hoja 2: indicadores calculados solo sobre los registros exportados.
      const entradas = seleccion.filter((m) => m.tipo === "ENTRADA");
      const salidas = seleccion.filter((m) => m.tipo === "SALIDA");
      const totalEntradas = entradas.reduce(
        (total, m) => total + Number(m.cantidad),
        0,
      );
      const totalSalidas = salidas.reduce(
        (total, m) => total + Number(m.cantidad),
        0,
      );
      const productosInvolucrados = new Set(seleccion.map((m) => m.productoId))
        .size;
      const fechaReporte = new Date();
      const tipoSeleccionado = {
        TODOS: "Todos los movimientos",
        ENTRADA: "Solo entradas",
        SALIDA: "Solo salidas",
      }[filtroTipo];

      const resumen = [
        {
          indicador: "Fecha del reporte",
          valor: fechaReporte.toLocaleString("es-AR", {
            hour12: false,
          }),
          descripcion: "Momento de generación del archivo.",
        },
        {
          indicador: "Filtro de tipo",
          valor: tipoSeleccionado,
          descripcion: "Tipo de movimiento seleccionado en pantalla.",
        },
        {
          indicador: "Búsqueda de producto",
          valor: busquedaProducto.trim() || "Todos los productos",
          descripcion: "Término utilizado para filtrar por nombre.",
        },
        {
          indicador: "Movimientos exportados",
          valor: seleccion.length,
          descripcion: "Cantidad de registros que coinciden con los filtros.",
        },
        {
          indicador: "Productos involucrados",
          valor: productosInvolucrados,
          descripcion: "Cantidad de productos diferentes en la selección.",
        },
        {
          indicador: "Movimientos de entrada",
          valor: entradas.length,
          descripcion: "Cantidad de registros de entrada exportados.",
        },
        {
          indicador: "Movimientos de salida",
          valor: salidas.length,
          descripcion: "Cantidad de registros de salida exportados.",
        },
        {
          indicador: "Unidades ingresadas",
          valor: totalEntradas,
          descripcion: "Suma de cantidades de las entradas exportadas.",
        },
        {
          indicador: "Unidades retiradas",
          valor: totalSalidas,
          descripcion: "Suma de cantidades de las salidas exportadas.",
        },
        {
          indicador: "Balance de unidades",
          valor: totalEntradas - totalSalidas,
          descripcion:
            "Entradas menos salidas de la selección. No es el stock actual.",
        },
      ];

      crearHoja(
        workbook,
        "Resumen del historial",
        [
          { header: "Indicador", key: "indicador", width: 32 },
          { header: "Valor", key: "valor", width: 34 },
          { header: "Descripción", key: "descripcion", width: 78 },
        ],
        resumen,
      );

      const fechaArchivo = [
        fechaReporte.getFullYear(),
        String(fechaReporte.getMonth() + 1).padStart(2, "0"),
        String(fechaReporte.getDate()).padStart(2, "0"),
      ].join("-");

      await descargarExcel(
        workbook,
        `historial-movimientos-${filtroTipo.toLowerCase()}-${fechaArchivo}`,
      );
    } catch (error) {
      console.error("Error al exportar movimientos:", error);
      setErrorExportacion("No se pudo generar el Excel del historial.");
    } finally {
      setExportandoExcel(false);
    }
  };

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

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="tabla-contador">
              {movimientosFiltrados.length} de {movimientos.length} movimientos
            </span>

            <button
              type="button"
              className="dashboard-actualizar"
              style={{ marginTop: 0 }}
              onClick={exportarMovimientosExcel}
              disabled={
                exportandoExcel ||
                cargandoHistorial ||
                Boolean(errorHistorial) ||
                movimientosFiltrados.length === 0
              }
            >
              {exportandoExcel ? "Exportando..." : "Exportar historial Excel"}
            </button>
          </div>
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

        {errorExportacion && (
          <div className="mensaje-error" role="alert">
            <p>{errorExportacion}</p>
          </div>
        )}

        {cargandoHistorial ? (
          <p>Cargando historial de movimientos...</p>
        ) : errorHistorial ? (
          <div className="mensaje-error" role="alert">
            <p>{errorHistorial} Recargá la página para volver a intentar.</p>
          </div>
        ) : movimientosFiltrados.length === 0 ? (
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
                        {new Date(movimiento.fecha).toLocaleString("es-AR", {
                          hour12: false,
                        })}
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
