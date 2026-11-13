import { useEffect, useState } from "react";

function Dashboard() {
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [productosSinStock, setProductosSinStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [valorInventario, setValorInventario] = useState(0);
  const [productosSinCosto, setProductosSinCosto] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [movimientosPorMes, setMovimientosPorMes] = useState({});
  const [productosAgotados, setProductosAgotados] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("todos");
  const [cargandoMovimientos, setCargandoMovimientos] = useState(true);
  const [errorMovimientos, setErrorMovimientos] = useState("");
  const [valorPotencialVenta, setValorPotencialVenta] = useState(0);

  const [recarga, setRecarga] = useState(0);

  const actualizarDatos = () => {
    setLoading(true);
    setError("");

    setCargandoMovimientos(true);
    setErrorMovimientos("");

    setRecarga((valorAnterior) => valorAnterior + 1);
  };

  useEffect(() => {
    fetch("http://localhost:8080/productos")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("Error al cargar productos");
        }
        return respuesta.json();
      })
      .then((productos) => {
        setTotalProductos(productos.length);

        const unidades = productos.reduce(
          (total, producto) => total + Number(producto.stock ?? 0),
          0,
        );

        setTotalUnidades(unidades);
        const agotados = productos.filter(
          (producto) => Number(producto.stock) === 0,
        );

        setProductosSinStock(agotados.length);
        setProductosAgotados(agotados);

        const valor = productos.reduce((total, producto) => {
          if (producto.costoCompra == null) {
            return total;
          }

          return (
            total + Number(producto.stock ?? 0) * Number(producto.costoCompra)
          );
        }, 0);

        setValorInventario(valor);

        const valorVenta = productos.reduce(
          (total, producto) =>
            total + Number(producto.stock ?? 0) * Number(producto.precio ?? 0),
          0,
        );

        setValorPotencialVenta(valorVenta);

        const sinCosto = productos.filter(
          (producto) => producto.costoCompra == null,
        ).length;

        setProductosSinCosto(sinCosto);
      })
      .catch((error) => {
        console.error("Error en Dashboard:", error);
        setError("No se pudieron cargar los indicadores.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recarga]);

  useEffect(() => {
    fetch("http://localhost:8080/movimientos")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("Error al cargar movimientos");
        }

        return respuesta.json();
      })
      .then((datos) => {
        setMovimientos(datos);

        const resumenMensual = datos.reduce((resumen, movimiento) => {
          const mes = movimiento.fecha.substring(0, 7);

          if (!resumen[mes]) {
            resumen[mes] = {
              entradas: 0,
              salidas: 0,
            };
          }

          if (movimiento.tipo === "ENTRADA") {
            resumen[mes].entradas += Number(movimiento.cantidad);
          }

          if (movimiento.tipo === "SALIDA") {
            resumen[mes].salidas += Number(movimiento.cantidad);
          }

          return resumen;
        }, {});

        setMovimientosPorMes(resumenMensual);
      })
      .catch((error) => {
        console.error("Error en movimientos:", error);
        setErrorMovimientos(
          "No se pudieron cargar las estadísticas de movimientos.",
        );
      })
      .finally(() => {
        setCargandoMovimientos(false);
      });
  }, [recarga]);

  const porcentajeCostos =
    totalProductos > 0
      ? Math.round(
          ((totalProductos - productosSinCosto) / totalProductos) * 100,
        )
      : 0;

  const mesesDisponibles = Object.keys(movimientosPorMes).sort().reverse();

  const movimientosFiltrados =
    periodoSeleccionado === "todos"
      ? movimientos
      : movimientos.filter(
          (movimiento) =>
            movimiento.fecha.substring(0, 7) === periodoSeleccionado,
        );

  const totalEntradas = movimientosFiltrados
    .filter((movimiento) => movimiento.tipo === "ENTRADA")
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);

  const totalSalidas = movimientosFiltrados
    .filter((movimiento) => movimiento.tipo === "SALIDA")
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);

  const escalaMovimientos = Math.max(totalEntradas, totalSalidas, 1);

  const datosGraficoMensual = Object.entries(movimientosPorMes)
    .filter(
      ([mes]) => periodoSeleccionado === "todos" || mes === periodoSeleccionado,
    )
    .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
    .map(([mes, datos]) => ({
      mes: mes,
      entradas: datos.entradas,
      salidas: datos.salidas,
    }));

  const escalaMensual = Math.max(
    1,
    ...Object.values(movimientosPorMes).flatMap((datos) => [
      datos.entradas,
      datos.salidas,
    ]),
  );

  const formatearMes = (mes) => {
    const [anio, numeroMes] = mes.split("-");

    const fecha = new Date(Number(anio), Number(numeroMes) - 1, 1);

    return fecha.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  };

  const rankingProductos = Object.values(
    movimientosFiltrados.reduce((acumulador, movimiento) => {
      const id = movimiento.productoId;

      if (!acumulador[id]) {
        acumulador[id] = {
          id: id,
          nombre: movimiento.productoNombre,
          entradas: 0,
          salidas: 0,
        };
      }

      if (movimiento.tipo === "ENTRADA") {
        acumulador[id].entradas += Number(movimiento.cantidad);
      } else if (movimiento.tipo === "SALIDA") {
        acumulador[id].salidas += Number(movimiento.cantidad);
      }

      return acumulador;
    }, {}),
  )
    .map((producto) => ({
      ...producto,
      total: producto.entradas + producto.salidas,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const exportarResumenCSV = () => {
    if (datosGraficoMensual.length === 0) return;

    const filas = [
      ["Mes", "Entradas", "Salidas", "Balance"],
      ...datosGraficoMensual.map((dato) => [
        formatearMes(dato.mes),
        dato.entradas,
        dato.salidas,
        dato.entradas - dato.salidas,
      ]),
    ];

    const contenido =
      "\uFEFF" + filas.map((fila) => fila.join(";")).join("\r\n");

    const archivo = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `movimientos-${periodoSeleccionado}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="contenido-principal dashboard-page">
      <div className="contenido-header">
        <h2>Dashboard</h2>
        <p>Resumen general de la gestión de la cerrajería.</p>

        <button
          type="button"
          className="dashboard-actualizar"
          onClick={actualizarDatos}
          disabled={loading || cargandoMovimientos}
        >
          {loading || cargandoMovimientos
            ? "Actualizando..."
            : "↻ Actualizar datos"}
        </button>
      </div>

      {loading && <p>Cargando indicadores...</p>}

      {error && <div className="mensaje-error">{error}</div>}

      {!loading && !error && (
        <div className="dashboard-grid">
          <div className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Productos registrados</h3>
                <p>Total de productos diferentes en el inventario.</p>
              </div>

              <span className="tabla-contador">{totalProductos} productos</span>
            </div>
          </div>

          <div className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Unidades en stock</h3>
                <p>Cantidad total disponible en el inventario.</p>
              </div>

              <span className="tabla-contador">{totalUnidades} unidades</span>
            </div>
          </div>

          <div className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Productos sin stock</h3>
                <p>Productos que necesitan reposición.</p>
              </div>

              <span className="tabla-contador">
                {productosSinStock}{" "}
                {productosSinStock === 1 ? "producto" : "productos"}
              </span>
            </div>
          </div>

          <div className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Valor del inventario</h3>
                <p>Mercadería valorizada a costo de compra registrado.</p>
              </div>

              <span className="tabla-contador">
                {valorInventario.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </span>

              <p>
                {productosSinCosto === 0
                  ? "Todos los productos tienen costo registrado."
                  : `Valor parcial: ${productosSinCosto} productos sin costo registrado.`}
              </p>

              <p>Cobertura de costos: {porcentajeCostos}%</p>
            </div>
          </div>

          <div className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Valor potencial de venta</h3>
                <p>Valor de las existencias a precio de venta.</p>
              </div>

              <span className="tabla-contador">
                {valorPotencialVenta.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {cargandoMovimientos && <p>Cargando estadísticas de movimientos...</p>}

      {errorMovimientos && (
        <div className="mensaje-error">{errorMovimientos}</div>
      )}

      {!cargandoMovimientos &&
        !errorMovimientos &&
        movimientos.length === 0 && (
          <div className="estado-vacio">
            <p>Todavía no hay movimientos registrados.</p>
          </div>
        )}

      {!cargandoMovimientos && !errorMovimientos && movimientos.length > 0 && (
        <>
          <section className="tabla-card dashboard-movimientos">
            <div className="tabla-encabezado">
              <div>
                <h3>Estadísticas de movimientos</h3>
                <p>Resumen de entradas y salidas registradas.</p>
              </div>

              <div className="dashboard-filtro">
                <label htmlFor="periodo-movimientos">Período</label>

                <select
                  id="periodo-movimientos"
                  value={periodoSeleccionado}
                  onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                >
                  <option value="todos">Todo el historial</option>

                  {mesesDisponibles.map((mes) => (
                    <option key={mes} value={mes}>
                      {formatearMes(mes)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="barra-entradas">
                Entradas: {totalEntradas} unidades
              </label>

              <progress
                id="barra-entradas"
                value={totalEntradas}
                max={escalaMovimientos}
              />
            </div>

            <div>
              <label htmlFor="barra-salidas">
                Salidas: {totalSalidas} unidades
              </label>

              <progress
                id="barra-salidas"
                value={totalSalidas}
                max={escalaMovimientos}
              />
            </div>
          </section>

          <section className="tabla-card dashboard-movimientos dashboard-mensual">
            <div className="tabla-encabezado">
              <div>
                <h3>Evolución mensual</h3>
                <p>Comparación de entradas y salidas por mes.</p>
              </div>
            </div>

            {datosGraficoMensual.map((dato) => (
              <div key={dato.mes}>
                <h4>{formatearMes(dato.mes)}</h4>

                <label htmlFor={`entrada-${dato.mes}`}>
                  Entradas: {dato.entradas} unidades
                </label>
                <progress
                  id={`entrada-${dato.mes}`}
                  value={dato.entradas}
                  max={escalaMensual}
                />

                <label htmlFor={`salida-${dato.mes}`}>
                  Salidas: {dato.salidas} unidades
                </label>
                <progress
                  id={`salida-${dato.mes}`}
                  value={dato.salidas}
                  max={escalaMensual}
                />
              </div>
            ))}
          </section>

          <section className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Movimientos por mes</h3>
                <p>Resumen mensual de entradas y salidas.</p>
              </div>

              <button
                type="button"
                className="dashboard-actualizar"
                onClick={exportarResumenCSV}
                disabled={datosGraficoMensual.length === 0}
              >
                Exportar CSV
              </button>
            </div>

            <div className="tabla-responsive">
              <table className="productos-tabla">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Entradas</th>
                    <th>Salidas</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {datosGraficoMensual.map((dato) => {
                    const balance = dato.entradas - dato.salidas;

                    return (
                      <tr key={dato.mes}>
                        <td>{formatearMes(dato.mes)}</td>
                        <td>{dato.entradas}</td>
                        <td>{dato.salidas}</td>

                        <td
                          className={
                            balance > 0
                              ? "balance-positivo"
                              : balance < 0
                                ? "balance-negativo"
                                : "balance-neutro"
                          }
                        >
                          {balance > 0 ? "+" : ""}
                          {balance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="tabla-card">
            <div className="tabla-encabezado">
              <div>
                <h3>Productos con más movimientos</h3>
                <p>Top 5 según unidades ingresadas y retiradas.</p>
              </div>
            </div>

            {rankingProductos.length === 0 ? (
              <p>No hay movimientos registrados.</p>
            ) : (
              <div className="tabla-responsive">
                <table className="productos-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Entradas</th>
                      <th>Salidas</th>
                      <th>Total movido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingProductos.map((producto) => (
                      <tr key={producto.id}>
                        <td>{producto.nombre}</td>
                        <td>{producto.entradas}</td>
                        <td>{producto.salidas}</td>
                        <td>{producto.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!loading && !error && (
        <section className="tabla-card">
          <div className="tabla-encabezado">
            <div>
              <h3>Alertas de inventario</h3>
              <p>Productos que necesitan reposición.</p>
            </div>

            <span className="tabla-contador">
              {productosAgotados.length} agotados
            </span>
          </div>

          {productosAgotados.length === 0 ? (
            <div className="estado-vacio">
              <p>¡Todos los productos tienen stock disponible!</p>
            </div>
          ) : (
            <div className="tabla-responsive">
              <table className="productos-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock actual</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {productosAgotados.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>
                      <td>{producto.stock}</td>
                      <td>
                        <span className="stock-badge stock-agotado">
                          Sin stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Dashboard;
