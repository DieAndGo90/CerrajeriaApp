// Reglas de stock compartidas por las pantallas de inventario.
export function obtenerEstadoStock(producto) {
  if (producto.activo === false) return "inactivo";
  if (producto.stock === 0) return "agotado";
  if (producto.stock <= (producto.stockMinimo ?? 0)) return "bajo";
  return "normal";
}

export function coincideFiltroStock(producto, filtro) {
  const estado = obtenerEstadoStock(producto);
  if (filtro === "todos") return true;
  if (filtro === "alertas") return estado === "bajo" || estado === "agotado";
  return estado === filtro;
}

// Etiquetas de stock compartidas por la interfaz y los reportes.
export function etiquetaEstadoStock(producto) {
  return { normal: "Stock normal", bajo: "Stock bajo", agotado: "Sin stock", inactivo: "Inactivo" }[obtenerEstadoStock(producto)];
}
