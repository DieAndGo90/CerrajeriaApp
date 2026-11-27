function Sidebar({ paginaActual, cambiarPagina }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🔐</span>
        <h1>CerrajeriaApp</h1>
      </div>

      <nav className="sidebar-nav" aria-label="Menu principal">
        <p className="sidebar-seccion">Operaciones</p>
        {[
          ["productos", "📦", "Inventario"],
          ["movimientos", "🔄", "Movimientos de stock"],
          ["ajustes", "📝", "Ajustes de inventario"],
          ["precios", "🏷️", "Actualizar precios"],
        ].map(([id, icono, texto]) => (
          <button key={id} type="button"
            className={`nav-item ${paginaActual === id ? "active" : ""}`}
            aria-current={paginaActual === id ? "page" : undefined}
            onClick={() => cambiarPagina(id)}>
            <span aria-hidden="true">{icono}</span> {texto}
          </button>
        ))}
        <p className="sidebar-seccion sidebar-seccion-admin">Administración</p>
        <button type="button"
          className={`nav-item ${paginaActual === "dashboard" ? "active" : ""}`}
          aria-current={paginaActual === "dashboard" ? "page" : undefined}
          onClick={() => cambiarPagina("dashboard")}>
          <span aria-hidden="true">📊</span> Panel de control
        </button>
        <button type="button"
          className={`nav-item ${paginaActual === "auditoria" ? "active" : ""}`}
          aria-current={paginaActual === "auditoria" ? "page" : undefined}
          onClick={() => cambiarPagina("auditoria")}>
          <span aria-hidden="true">📋</span> Auditoría
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
