function Sidebar({ paginaActual, cambiarPagina }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🔐</span>
        <h1>CerrajeriaApp</h1>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${paginaActual === "dashboard" ? "active" : ""}`}
          onClick={() => cambiarPagina("dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          className={`nav-item ${paginaActual === "productos" ? "active" : ""}`}
          onClick={() => cambiarPagina("productos")}
        >
          Productos
        </button>

        <button
          type="button"
          className={`nav-item ${paginaActual === "movimientos" ? "active" : ""}`}
          onClick={() => cambiarPagina("movimientos")}
        >
          Movimientos de Stock
        </button>

        <button
          className={`nav-item ${paginaActual === "precios" ? "active" : ""}`}
          onClick={() => cambiarPagina("precios")}
        >
          📈 Actualizar precios
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
