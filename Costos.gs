/**
 * Costos.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Motor de costos de producción y precios de venta basado en recetas y sub-recetas.
 * Recalcula automáticamente márgenes de ganancia y puntos de equilibrio.
 */

// Gastos fijos mensuales aproximados de planta (USD) - Configurable administrativamente
const GASTOS_OPERATIVOS_FIJOS = 850.00;

/**
 * Calcula y actualiza el costo de producción para todos los productos en el catálogo.
 * Se ejecuta automáticamente al registrar compras de materia prima.
 */
function recalcularTodosLosCostos() {
  const productos = readAll("Productos");
  const recetas = readAll("Recetas");
  
  if (productos.length === 0) return "No hay productos registrados.";
  
  productos.forEach(prod => {
    const formula = recetas.filter(r => r.producto_id === prod.id);
    if (formula.length === 0) return; // Sin receta registrada
    
    // Obtener desglose de gramos aplicando los porcentajes de panadero
    // Usamos paquetes = 1 para obtener el costo unitario de 1 paquete
    const calculoProduccion = calcularOrdenProduccion(prod.id, 1);
    
    let costoMateriaPrimaUSD = 0;
    calculoProduccion.desglose.forEach(ing => {
      const costoKg = obtenerCostoPromedioMateriaPrima(ing.ingrediente);
      const costoIngrediente = (ing.gramos / 1000) * costoKg;
      costoMateriaPrimaUSD += costoIngrediente;
    });
    
    // Suma de Costos Indirectos (Embalaje, etiquetas, bolsas, gas, etc)
    // Supongamos un valor estimado de empaque de $0.05 por paquete
    const costoEmpaqueUSD = 0.05;
    const costoDirectoTotal = costoMateriaPrimaUSD + costoEmpaqueUSD;
    
    // Gastos Operativos Indirectos Fijos de Mesa (prorrateados, ej: 10% del costo directo)
    const factorGastosOperativos = 0.10;
    const costoTotalUSD = costoDirectoTotal * (1 + factorGastosOperativos);
    
    // Guardar el costo calculado en el producto
    updateRow("Productos", prod.id, {
      "costo_usd": costoTotalUSD.toFixed(2)
    });
  });
  
  return "Costos recalculados correctamente para todos los productos.";
}

/**
 * Simula el precio de venta sugerido y el margen de ganancia real de un producto.
 */
function simularPrecioVenta(productoId, margenDeseadoPorcentaje) {
  const productos = readAll("Productos");
  const prod = productos.find(p => p.id === productoId);
  if (!prod) throw new Error("Producto no encontrado.");
  
  const costo = parseFloat(prod.costo_usd) || 0;
  const margen = parseFloat(margenDeseadoPorcentaje) / 100;
  
  if (margen >= 1) throw new Error("El margen debe ser menor a 100%.");
  
  // Precio Sugerido = Costo / (1 - Margen)
  const precioSugerido = costo / (1 - margen);
  
  return {
    producto: prod.nombre,
    costoUsd: costo,
    margenSimulado: margenDeseadoPorcentaje + "%",
    precioVentaSugeridoUSD: precioSugerido.toFixed(2),
    precioVentaSugeridoVES: (precioSugerido * getBcbRate()).toFixed(2)
  };
}

/**
 * Establece el precio de venta oficial para un producto y su stock disponible.
 */
function actualizarPrecioYStock(productoId, precioUsd, stock) {
  return updateRow("Productos", productoId, {
    "precio_venta_usd": parseFloat(precioUsd).toFixed(2),
    "stock_disponible": parseFloat(stock)
  });
}
