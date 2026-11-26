import { useEffect, useState } from "react";
import { apiFetch } from "../apiFetch";
import { crearLibro, crearHoja, descargarExcel } from "../utils/excel";
import "./Auditoria.css";

const API_URL = "http://localhost:8080/auditoria";
const acciones = {
  INICIO_SESION: "Inicio de sesión",
  CIERRE_SESION: "Cierre de sesión",
  CREAR_PRODUCTO: "Crear producto",
  EDITAR_PRODUCTO: "Editar producto",
  ELIMINAR_PRODUCTO: "Eliminar producto",
  ACTIVAR_PRODUCTO: "Activar producto",
  DESACTIVAR_PRODUCTO: "Desactivar producto",
  ENTRADA_STOCK: "Entrada de stock",
  SALIDA_STOCK: "Salida de stock",
  MODIFICAR_STOCK_MINIMO: "Modificar stock mínimo",
  ACTUALIZAR_PRECIOS: "Actualización masiva de precios",
};

function mostrarFecha(fecha) {
  if (!fecha) return "—";
  const [dia, hora] = fecha.split("T");
  return `${dia.split("-").reverse().join("/")} ${hora?.slice(0, 8) ?? ""}`;
}

function claseAccion(accion) {
  if (["CREAR_PRODUCTO", "ACTIVAR_PRODUCTO", "ENTRADA_STOCK"].includes(accion)) return "positiva";
  if (["ELIMINAR_PRODUCTO", "DESACTIVAR_PRODUCTO", "SALIDA_STOCK"].includes(accion)) return "atencion";
  if (["INICIO_SESION", "CIERRE_SESION"].includes(accion)) return "sesion";
  return "cambio";
}

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [usuario, setUsuario] = useState("");
  const [accion, setAccion] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");

  useEffect(() => {
    const controlador = new AbortController();
    apiFetch(API_URL, { signal: controlador.signal })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          if (respuesta.status === 401) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
          if (respuesta.status === 403) throw new Error("No tenés permisos para consultar la auditoría.");
          throw new Error("No se pudo consultar la auditoría.");
        }
        const datos = await respuesta.json();
        if (!Array.isArray(datos)) throw new Error("La respuesta de auditoría no es válida.");
        if (!controlador.signal.aborted) setRegistros(datos);
      })
      .catch((err) => {
        if (!controlador.signal.aborted) {
          setRegistros([]);
          setError(err.message || "No se pudo consultar la auditoría.");
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });
    return () => controlador.abort();
  }, [recarga]);

  const usuarios = [...new Set(registros.map((r) => r.usuario))].sort();
  const termino = busqueda.trim().toLocaleLowerCase("es-AR");
  const rangoInvalido = Boolean(desde && hasta && desde > hasta);
  const visibles = rangoInvalido ? [] : registros.filter((r) => {
    const dia = r.fecha?.slice(0, 10) ?? "";
    return (!usuario || r.usuario === usuario) &&
      (!accion || r.accion === accion) &&
      (!desde || dia >= desde) && (!hasta || dia <= hasta) &&
      (!termino || [r.detalle, r.usuario, r.productoId, acciones[r.accion], r.accion]
        .some((valor) => String(valor ?? "").toLocaleLowerCase("es-AR").includes(termino)));
  });

  async function exportarAuditoria(soloFiltrados) {
    if (cargando || error || exportando || (soloFiltrados && rangoInvalido)) return;
    const datos = soloFiltrados ? visibles : registros;
    if (!datos.length) return;
    setExportando(true);
    setErrorExportacion("");

    try {
      const libro = crearLibro();
      const filas = datos.map((r) => {
        // El backend entrega LocalDateTime sin zona horaria.
        // Excel usa fechas sin zona: conservamos la hora mostrada en pantalla.
        const fecha = new Date(`${(r.fecha ?? "").slice(0, 19)}Z`);
        return {
          id: r.id,
          fecha: Number.isNaN(fecha.getTime()) ? mostrarFecha(r.fecha) : fecha,
          usuario: r.usuario,
          accion: acciones[r.accion] ?? r.accion,
          productoId: r.productoId ?? null,
          detalle: r.detalle ?? "",
        };
      });
      const hoja = crearHoja(libro, "Auditoría", [
        { header: "ID registro", key: "id", width: 14 },
        { header: "Fecha y hora", key: "fecha", width: 24, style: { numFmt: "dd/mm/yyyy hh:mm:ss" } },
        { header: "Usuario", key: "usuario", width: 20 },
        { header: "Acción", key: "accion", width: 35 },
        { header: "ID producto", key: "productoId", width: 15 },
        { header: "Detalle", key: "detalle", width: 90 },
      ], filas);
      hoja.eachRow((fila, numero) => {
        if (numero > 1) fila.getCell(6).alignment = { wrapText: true, vertical: "top" };
      });

      const resumen = crearHoja(libro, "Información del reporte", [
        { header: "Concepto", key: "concepto", width: 30 },
        { header: "Valor", key: "valor", width: 90 },
      ], [
        { concepto: "Generado", valor: new Date().toLocaleString("es-AR", { hour12: false }) },
        { concepto: "Alcance", valor: soloFiltrados ? "Resultados filtrados" : "Todos los registros cargados" },
        { concepto: "Límite del historial", valor: "Hasta 100 registros recientes; no incluye registros anteriores no cargados." },
        { concepto: "Registros exportados", valor: datos.length },
        { concepto: "Registros cargados", valor: registros.length },
        { concepto: "Usuario", valor: soloFiltrados ? usuario || "Todos" : "Todos" },
        { concepto: "Acción", valor: soloFiltrados ? acciones[accion] || accion || "Todas" : "Todas" },
        { concepto: "Desde", valor: soloFiltrados ? desde || "Sin límite" : "Sin filtro" },
        { concepto: "Hasta", valor: soloFiltrados ? hasta || "Sin límite" : "Sin filtro" },
        { concepto: "Búsqueda", valor: soloFiltrados ? busqueda.trim() || "Sin búsqueda" : "Sin filtro" },
      ]);
      resumen.autoFilter = undefined;
      const hoy = new Date();
      const dia = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      await descargarExcel(libro, `auditoria-${soloFiltrados ? "filtrada" : "historial"}-${dia}`);
    } catch (err) {
      console.error("Error al exportar auditoría:", err);
      setErrorExportacion("No se pudo generar el archivo Excel. Volvé a intentarlo.");
    } finally {
      setExportando(false);
    }
  }

  function actualizar() {
    setCargando(true);
    setError("");
    setRecarga((valor) => valor + 1);
  }

  function limpiar() {
    setUsuario("");
    setAccion("");
    setDesde("");
    setHasta("");
    setBusqueda("");
  }

  return (
    <main className="contenido-principal auditoria-page">
      <div className="contenido-header">
        <h2>Auditoría de acciones</h2>
        <p>Consultá quién realizó cada operación y cuándo.</p>
      </div>
      <section className="auditoria-card" aria-label="Historial de auditoría">
        <div className="auditoria-encabezado">
          <div>
            <h3>Historial de actividad</h3>
            <p>Últimos 100 registros disponibles. Acceso exclusivo de administración.</p>
          </div>
          <div className="auditoria-acciones-exportar">
            <button type="button" className="btn-limpiar" onClick={() => exportarAuditoria(false)}
              disabled={cargando || Boolean(error) || exportando || !registros.length}>
              {exportando ? "Exportando..." : "Exportar historial"}
            </button>
            <button type="button" className="btn-limpiar" onClick={() => exportarAuditoria(true)}
              disabled={cargando || Boolean(error) || exportando || rangoInvalido || !visibles.length}>
              {exportando ? "Exportando..." : "Exportar resultados"}
            </button>
            <button type="button" className="btn-primario" onClick={actualizar} disabled={cargando || exportando}>
              {cargando ? "Cargando..." : "Actualizar historial"}
            </button>
          </div>
        </div>
        <div className="auditoria-filtros">
          <div className="auditoria-campo">
            <label htmlFor="auditoria-usuario">Usuario</label>
            <select id="auditoria-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)}>
              <option value="">Todos los usuarios</option>
              {usuarios.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="auditoria-campo">
            <label htmlFor="auditoria-accion">Acción</label>
            <select id="auditoria-accion" value={accion} onChange={(e) => setAccion(e.target.value)}>
              <option value="">Todas las acciones</option>
              {Object.entries(acciones).map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
            </select>
          </div>
          <div className="auditoria-campo">
            <label htmlFor="auditoria-desde">Desde</label>
            <input id="auditoria-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="auditoria-campo">
            <label htmlFor="auditoria-hasta">Hasta</label>
            <input id="auditoria-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="auditoria-campo auditoria-busqueda">
            <label htmlFor="auditoria-busqueda">Buscar en el historial</label>
            <input id="auditoria-busqueda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Producto, ID, detalle..." />
          </div>
          <button type="button" className="btn-limpiar auditoria-limpiar" onClick={limpiar}>Limpiar filtros</button>
        </div>
        {errorExportacion && <p className="auditoria-error" role="alert">{errorExportacion}</p>}
        <p className="auditoria-contador" aria-live="polite">{visibles.length} de {registros.length} registros cargados</p>
        {rangoInvalido && <p className="auditoria-error" role="alert">La fecha Desde no puede ser posterior a Hasta.</p>}
        {error ? <p className="auditoria-error" role="alert">{error}</p> : cargando ? (
          <p className="auditoria-vacio" role="status">Cargando historial...</p>
        ) : visibles.length === 0 ? (
          <p className="auditoria-vacio">No hay registros que coincidan con los filtros.</p>
        ) : (
          <div className="auditoria-tabla-scroll">
            <table className="auditoria-tabla">
              <thead><tr>
                <th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>ID producto</th><th>Detalle</th>
              </tr></thead>
              <tbody>{visibles.map((r) => (
                <tr key={r.id}>
                  <td className="auditoria-fecha">{mostrarFecha(r.fecha)}</td>
                  <td><strong>{r.usuario}</strong></td>
                  <td><span className={`auditoria-badge auditoria-${claseAccion(r.accion)}`}>{acciones[r.accion] ?? r.accion}</span></td>
                  <td>{r.productoId ?? "—"}</td>
                  <td className="auditoria-detalle">{r.detalle}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
