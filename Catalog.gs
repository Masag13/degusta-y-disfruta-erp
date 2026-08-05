/**
 * Catalog.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Sincroniza y expone el stock de catálogo listo para las redes sociales y marketing.
 */

/**
 * Obtiene la lista de catálogo público con precios en dólares, bolívares y stock disponible.
 * Esta función es consumida por el Frontend y el Feed de Marketing.
 */
function obtenerCatalogoPublico() {
  const productos = readAll("Productos");
  const tasa = getBcbRate();
  
  return productos.map(p => {
    const precioUsd = parseFloat(p.precio_venta_usd) || 0;
    const stock = parseFloat(p.stock_disponible) || 0;
    
    return {
      id: p.id,
      nombre: p.nombre,
      unidad_empaque: p.unidad_empaque || "Unidades",
      precio_usd: precioUsd.toFixed(2),
      precio_ves: (precioUsd * tasa).toFixed(2),
      disponibilidad: stock > 0 ? "Disponible" : "Agotado",
      stock: stock
    };
  });
}

/**
 * Endpoint para webhook o feeds externos de marketing en formato JSON.
 */
function doGetFeedPublico() {
  const catalogo = obtenerCatalogoPublico();
  const output = ContentService.createTextOutput(JSON.stringify(catalogo));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
