import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../apiFetch";
import "./AjustesInventario.css";

const API = "http://localhost:8080";
const MAX_STOCK = 2147483647;
const PREFIJO = "AJUSTE DE INVENTARIO |";
const motivos = ["Diferencia de conteo físico", "Producto dañado", "Pérdida o extravío", "Robo o faltante", "Error de registro", "Otro motivo"];

async function consultar(ruta, signal) {
  const respuesta = await apiFetch(`${API}${ruta}`, { signal });
  if (respuesta.status === 401) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
  if (respuesta.status === 403) throw new Error("No tenés permisos para esta operación.");
  if (!respuesta.ok) throw new Error(`No se pudo consultar la información (${respuesta.status}).`);
  const datos = await respuesta.json();
  if (!Array.isArray(datos)) throw new Error("La respuesta del servidor no es válida.");
  return datos;
}

export default function AjustesInventario() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [stockReal, setStockReal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorHistorial, setErrorHistorial] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [requiereRecarga, setRequiereRecarga] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const enviando = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    const signal = controlador.signal;
    Promise.allSettled([
      consultar("/productos/stock", signal),
      consultar("/movimientos", signal),
    ]).then(([p, m]) => {
      if (signal.aborted) return;
      if (p.status === "fulfilled") {
        setProductos(p.value);
        setRequiereRecarga(false);
      } else {
        setProductos([]);
        setErrorCarga(p.reason.message);
      }
      if (m.status === "fulfilled") setMovimientos(m.value);
      else setErrorHistorial(m.reason.message);
      setCargando(false);
    });
    return () => controlador.abort();
  }, [recarga]);

  const producto = productos.find((p) => String(p.id) === productoId);
  const real = Number(stockReal);
  const cantidadValida = stockReal.trim() !== "" && Number.isInteger(real) && real >= 0 && real <= MAX_STOCK;
  const diferencia = producto && cantidadValida ? real - producto.stock : null;
  const motivoFinal = motivo === "Otro motivo" ? detalle.trim() : motivo;
  const motivoValido = motivoFinal.length > 0 && motivoFinal.length <= 120;
  const habilitado = Boolean(producto && cantidadValida && diferencia !== 0 && motivoValido && !cargando && !errorCarga && !guardando && !requiereRecarga);
  const ajustes = movimientos.filter((m) => m.observacion?.startsWith(PREFIJO));
  const visibles = ajustes.filter((m) => `${m.productoNombre} ${m.observacion}`.toLocaleLowerCase("es-AR").includes(busqueda.trim().toLocaleLowerCase("es-AR")))
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id);

  function actualizar() {
    if (guardando || enviando.current) return;
    setCargando(true);
    setErrorCarga("");
    setErrorHistorial("");
    setError("");
    setExito("");
    setProductoId("");
    setStockReal("");
    setMotivo("");
    setDetalle("");
    setRecarga((n) => n + 1);
  }

  async function registrar(evento) {
    evento.preventDefault();
    if (!habilitado || enviando.current) return;
    if (!window.confirm(`¿Confirmás el ajuste de ${producto.nombre}: ${producto.stock} → ${real} unidades?`)) return;
    enviando.current = true;
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const respuesta = await apiFetch(`${API}/movimientos/ajustes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: producto.id, stockEsperado: producto.stock, stockReal: real, motivo: motivoFinal }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        if (respuesta.status === 401) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
        if (respuesta.status === 403) throw new Error("No tenés permisos o la sesión dejó de ser válida.");
        const mensaje = datos?.error || Object.values(datos ?? {}).filter((v) => typeof v === "string").join(" · ");
        throw new Error(mensaje || `No se pudo confirmar el ajuste (${respuesta.status}).`);
      }
      const movimiento = await respuesta.json();
      setMovimientos((prev) => [movimiento, ...prev.filter((m) => m.id !== movimiento.id)]);
      setProductos((prev) => prev.map((p) => p.id === producto.id ? { ...p, stock: real } : p));
      setExito(`${producto.nombre}: stock ajustado de ${producto.stock} a ${real} unidades.`);
      setStockReal("");
      setMotivo("");
      setDetalle("");
      setProductoId("");
      // Confirmed adjustment; fetch fresh data before allowing another count.
      setRequiereRecarga(true);
      setCargando(true);
      setErrorHistorial("");
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(`${err.message || "No se pudo confirmar el ajuste."} Actualizá los datos y verificá el inventario antes de volver a intentar.`);
      setRequiereRecarga(true);
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  }

  return (
    <main className="contenido-principal ajustes-page">
      <div className="contenido-header">
        <h2>Ajustes de inventario</h2>
        <p>Conciliá el stock registrado con las existencias físicas del comercio.</p>
      </div>
      <form className="producto-formulario ajustes-form" onSubmit={registrar}>
        <div className="ajustes-encabezado">
          <div className="formulario-encabezado"><h3>Nuevo ajuste</h3><p>Solo productos activos. El stock se corrige mediante un movimiento.</p></div>
          <button type="button" className="btn-limpiar" disabled={cargando || guardando} onClick={actualizar}>Actualizar datos</button>
        </div>
        {cargando && <p role="status">Cargando inventario e historial...</p>}
        {errorCarga && <p className="mensaje-error" role="alert">{errorCarga}</p>}
        <div className="campo-formulario">
          <label htmlFor="ajuste-producto">Producto</label>
          <select id="ajuste-producto" required value={productoId} disabled={cargando || guardando || requiereRecarga || Boolean(errorCarga)} onChange={(e) => { setProductoId(e.target.value); setStockReal(""); setMotivo(""); setDetalle(""); setError(""); setExito(""); }}>
            <option value="">Seleccionar producto</option>
            {[...productos].sort((a,b) => a.nombre.localeCompare(b.nombre, "es-AR")).map((p) => <option key={p.id} value={p.id}>{p.nombre} — Stock: {p.stock} (ID {p.id})</option>)}
          </select>
        </div>
        <div className="ajustes-indicadores" aria-live="polite">
          <div className="ajuste-indicador"><span>Stock del sistema</span><strong>{producto?.stock ?? "—"}</strong></div>
          <div className="ajuste-indicador"><span>Diferencia</span><strong className={diferencia > 0 ? "ajuste-positivo" : diferencia < 0 ? "ajuste-negativo" : ""}>{diferencia === null ? "—" : `${diferencia > 0 ? "+" : ""}${diferencia}`}</strong></div>
          <div className="ajuste-indicador"><span>Stock después del ajuste</span><strong>{producto && cantidadValida ? real : "—"}</strong></div>
        </div>
        <div className="ajustes-campos">
          <div className="campo-formulario"><label htmlFor="ajuste-real">Stock físico contado</label><input id="ajuste-real" required type="number" min="0" max={MAX_STOCK} step="1" value={stockReal} disabled={!producto || guardando || requiereRecarga || cargando} onChange={(e) => setStockReal(e.target.value)} placeholder="Ej: 10" /></div>
          <div className="campo-formulario"><label htmlFor="ajuste-motivo">Motivo del ajuste</label><select id="ajuste-motivo" required value={motivo} disabled={guardando || requiereRecarga || cargando} onChange={(e) => {setMotivo(e.target.value); setDetalle("");}}><option value="">Seleccionar motivo</option>{motivos.map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        {motivo === "Otro motivo" && <div className="campo-formulario"><label htmlFor="ajuste-detalle">Describí el motivo</label><input id="ajuste-detalle" required maxLength={120} value={detalle} disabled={guardando || requiereRecarga || cargando} onChange={(e) => setDetalle(e.target.value)} /></div>}
        <p className="ajustes-aviso">{diferencia === null ? "Ingresá el conteo físico y el motivo. El sistema calculará la diferencia." : diferencia === 0 ? "No hay diferencias. No es necesario ajustar el inventario." : `Se registrará una ${diferencia > 0 ? "entrada" : "salida"} de ${Math.abs(diferencia)} unidades y una acción de auditoría.`}</p>
        {requiereRecarga && !cargando && <p className="ajustes-aviso">Actualizá los datos antes de registrar otro ajuste.</p>}
        {exito && <p className="mensaje-exito" role="status">{exito}</p>}
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <div className="form-acciones"><button type="submit" className="btn-primario" disabled={!habilitado}>{guardando ? "Registrando..." : "Registrar ajuste"}</button></div>
      </form>
      <section className="tabla-card">
        <div className="tabla-encabezado"><div><h3>Historial de ajustes</h3><p>Movimientos identificados por su observación de ajuste.</p></div><span className="tabla-contador">{visibles.length} de {ajustes.length} ajustes</span></div>
        <div className="historial-filtros"><div className="filtro-producto"><label htmlFor="ajuste-busqueda">Buscar</label><input id="ajuste-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Producto o motivo" /></div></div>
        {errorHistorial ? <p className="mensaje-error" role="alert">{errorHistorial} Usá Actualizar datos para reintentar.</p> : cargando ? <p className="estado-carga">Cargando ajustes...</p> : !visibles.length ? <div className="estado-vacio"><h3>No hay ajustes para mostrar</h3><p>Los ajustes registrados aparecerán aquí.</p></div> : <div className="tabla-responsive"><table className="productos-tabla"><thead><tr><th>Fecha</th><th>Producto</th><th>Diferencia</th><th>Detalle</th></tr></thead><tbody>{visibles.map((m) => <tr key={m.id}><td>{new Date(m.fecha).toLocaleString("es-AR", { hour12: false })}</td><td>{m.productoNombre}</td><td><span className={`movimiento-badge ${m.tipo === "ENTRADA" ? "movimiento-entrada" : "movimiento-salida"}`}>{m.tipo === "ENTRADA" ? "+" : "−"}{m.cantidad}</span></td><td>{m.observacion.slice(PREFIJO.length).trim()}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
