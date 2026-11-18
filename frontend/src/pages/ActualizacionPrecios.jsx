import { useEffect, useState } from "react";
import { apiFetch } from "../apiFetch";

const API_URL = "http://localhost:8080/productos";

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function ActualizacionPrecios() {
  const [productos, setProductos] = useState([]);
  const [porcentaje, setPorcentaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  // CARGAR PRODUCTOS DESDE EL BACKEND
  useEffect(() => {
    const controller = new AbortController();

    apiFetch(API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos");
        }

        return response.json();
      })
      .then((data) => {
        setProductos(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError("No se pudieron cargar los productos.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      });

    return () => controller.abort();
  }, [recarga]);

  const porcentajeNumero = Number(porcentaje);

  const porcentajeValido =
    porcentaje.trim() !== "" &&
    Number.isFinite(porcentajeNumero) &&
    porcentajeNumero > 0;

  // CALCULAR PRECIO PARA LA VISTA PREVIA
  const calcularNuevoPrecio = (precio) => {
    return Number(precio) * (1 + porcentajeNumero / 100);
  };

  // VOLVER A CONSULTAR LOS PRODUCTOS
  const recargarProductos = () => {
    setCargando(true);
    setProductos([]);
    setError("");
    setRecarga((valor) => valor + 1);
  };

  // APLICAR AUMENTO MASIVO
  const aplicarAumento = async (e) => {
    e.preventDefault();

    if (!porcentajeValido) {
      setError("Ingresá un porcentaje mayor a cero.");
      return;
    }

    if (actualizando || cargando || productos.length === 0) {
      return;
    }

    const confirmar = window.confirm(
      `¿Confirmás aplicar un aumento del ${porcentajeNumero}% ` +
        `a los ${productos.length} productos del inventario? ` +
        `Esta operación modificará sus precios de venta.`,
    );

    if (!confirmar) return;

    setActualizando(true);
    setError("");
    setMensaje("");

    try {
      const response = await apiFetch(`${API_URL}/actualizar-precios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          porcentaje: porcentajeNumero,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar los precios");
      }

      const data = await response.json();

      setMensaje(
        `Se actualizaron correctamente ${data.productosActualizados} ` +
          `productos con un aumento del ${porcentajeNumero}%.`,
      );

      setPorcentaje("");

      // CONSULTAR LOS NUEVOS PRECIOS GUARDADOS EN MYSQL
      recargarProductos();
    } catch (err) {
      setError(
        `${err.message}. Volvé a consultar los precios antes de intentar nuevamente.`,
      );

      setProductos([]);
    } finally {
      setActualizando(false);
    }
  };

  return (
    <main className="contenido-principal precios-page">
      <div className="contenido-header">
        <h2>Actualización de precios</h2>

        <p>
          Actualizá los precios de venta de todo tu inventario mediante un
          porcentaje.
        </p>
      </div>

      {mensaje && (
        <div className="mensaje-exito" role="status">
          <span>✓</span>
          <p>{mensaje}</p>
        </div>
      )}

      {error && (
        <div className="mensaje-error" role="alert">
          <span>!</span>
          <div>
            <strong>Atención</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* FORMULARIO DE ACTUALIZACIÓN */}
      <form
        className="producto-formulario precios-formulario"
        onSubmit={aplicarAumento}
      >
        <div className="formulario-encabezado">
          <h3>📈 Aumento masivo</h3>

          <p>
            Ingresá el porcentaje de aumento que querés aplicar a todos los
            productos.
          </p>
        </div>

        <div className="precios-controles">
          <div className="campo-formulario">
            <label htmlFor="porcentaje">Porcentaje de aumento (%)</label>

            <input
              id="porcentaje"
              type="number"
              min="0"
              step="any"
              placeholder="Ej: 15"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              disabled={actualizando}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primario"
            disabled={
              !porcentajeValido ||
              actualizando ||
              cargando ||
              productos.length === 0
            }
          >
            {actualizando ? "Actualizando..." : "Aplicar aumento"}
          </button>
        </div>

        <div className="precios-aviso">
          <strong>Importante:</strong> esta operación modifica únicamente los
          precios de venta. Los costos de compra y las existencias permanecerán
          sin cambios.
        </div>
      </form>

      {/* VISTA PREVIA */}
      <section className="tabla-card">
        <div className="tabla-encabezado">
          <div>
            <h3>Vista previa de precios</h3>

            <p>
              Consultá los nuevos precios antes de confirmar la actualización.
            </p>
          </div>

          <span className="tabla-contador">{productos.length} productos</span>
        </div>

        {cargando ? (
          <div className="estado-carga">
            <div className="spinner"></div>
            Cargando productos...
          </div>
        ) : productos.length === 0 ? (
          <div className="estado-vacio">
            <div className="estado-vacio-icono">📦</div>

            <h3>No hay productos disponibles</h3>

            <p>
              Volvé a consultar el inventario para cargar los precios actuales.
            </p>

            <button
              type="button"
              className="btn-limpiar precios-recargar"
              onClick={recargarProductos}
              disabled={actualizando}
            >
              Recargar productos
            </button>
          </div>
        ) : (
          <div className="tabla-responsive">
            <table className="productos-tabla precios-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio actual</th>
                  <th>Nuevo precio</th>
                  <th>Diferencia</th>
                </tr>
              </thead>

              <tbody>
                {productos.map((producto) => {
                  const nuevoPrecio = calcularNuevoPrecio(producto.precio);

                  return (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>

                      <td>{formatoMoneda.format(producto.precio)}</td>

                      <td className="precio-nuevo">
                        {porcentajeValido
                          ? formatoMoneda.format(nuevoPrecio)
                          : "—"}
                      </td>

                      <td className="precio-diferencia">
                        {porcentajeValido
                          ? `+ ${formatoMoneda.format(
                              nuevoPrecio - producto.precio,
                            )}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ActualizacionPrecios;
