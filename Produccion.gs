/**
 * Produccion.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Gestiona el cálculo de masa, desgloses de recetas (porcentajes de panadero),
 * auditoría de pesaje de sacos e inventario de materias primas con alerta de mermas.
 */

/**
 * Calcula la masa requerida y desglose de ingredientes en gramos para un pedido.
 * @param {String} productoId ID del producto.
 * @param {Number} paquetes Cantidad de paquetes solicitados.
 */
function calcularOrdenProduccion(productoId, paquetes) {
  const productos = readAll("Productos");
  const prod = productos.find(p => p.id === productoId);
  if (!prod) throw new Error("Producto no encontrado.");
  
  // Obtener la receta del producto
  const recetas = readAll("Recetas");
  const formula = recetas.filter(r => r.producto_id === productoId);
  
  if (formula.length === 0) {
    throw new Error("El producto '" + prod.nombre + "' no tiene una receta registrada.");
  }
  
  // Calcular peso total de masa requerida (en gramos)
  // Unidad de empaque (ej: 6 panes, 12 panes)
  const unidadesPorPaquete = parseInt(prod.unidad_empaque || 12);
  const pesoPorUnidadG = parseFloat(prod.peso_por_unidad_g || 80);
  const totalUnidades = paquetes * unidadesPorPaquete;
  
  // Masa neta necesaria en gramos
  let masaTotalG = totalUnidades * pesoPorUnidadG;
  
  // Margen de tolerancia para mermas en mesa (ej: 2%)
  const TOLERANCIA_MESA = 1.02;
  masaTotalG = masaTotalG * TOLERANCIA_MESA;
  
  // Resolver usando Porcentajes de Panadero
  // Harina de trigo siempre representa el 100% (1.0)
  // Peso Total Masa = Peso Harina * (1 + Suma(Porcentajes_Otros_Ingredientes))
  
  let sumaPorcentajesOtros = 0;
  formula.forEach(ing => {
    const ingredienteNom = ing.ingrediente.toLowerCase();
    if (ingredienteNom !== "harina" && ingredienteNom !== "harina de trigo" && ingredienteNom !== "harina base") {
      sumaPorcentajesOtros += parseFloat(ing.porcentaje_panadero) / 100;
    }
  });
  
  // Calcular Harina Base (en gramos)
  const pesoHarinaG = masaTotalG / (1 + sumaPorcentajesOtros);
  
  // Desglosar gramos de cada ingrediente
  const desgloseIngredientes = formula.map(ing => {
    const ingNom = ing.ingrediente.toLowerCase();
    let pesoG = 0;
    if (ingNom === "harina" || ingNom === "harina de trigo" || ingNom === "harina base") {
      pesoG = pesoHarinaG;
    } else {
      pesoG = pesoHarinaG * (parseFloat(ing.porcentaje_panadero) / 100);
    }
    
    return {
      ingrediente: ing.ingrediente,
      porcentaje: ing.porcentaje_panadero,
      gramos: Math.round(pesoG)
    };
  });
  
  return {
    producto: prod.nombre,
    paquetes: paquetes,
    masaTotalKg: (masaTotalG / 1000).toFixed(2),
    desglose: desgloseIngredientes
  };
}

/**
 * Registra una nueva Orden de Producción.
 */
function crearOrdenProduccion(orden) {
  const calculo = calcularOrdenProduccion(orden.producto_id, orden.paquetes_requeridos);
  
  orden.id = Utilities.getUuid();
  orden.fecha = orden.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  orden.masa_total_kg = calculo.masaTotalKg;
  orden.ingredientes_gramos = JSON.stringify(calculo.desglose);
  orden.estado = "Pendiente"; // Pendiente, En Planta, Completado
  
  return createRow("OrdenesProduccion", orden);
}

/**
 * Actualiza el estado de la orden. Si se marca como "Completado",
 * descuenta los ingredientes de la hoja de Inventario y añade el stock al producto terminado.
 */
function actualizarEstadoOrden(ordenId, nuevoEstado) {
  const ss = getSpreadsheet();
  const ordenes = readAll("OrdenesProduccion");
  const orden = ordenes.find(o => o.id === ordenId);
  
  if (!orden) throw new Error("Orden de producción no encontrada.");
  if (orden.estado === nuevoEstado) return orden;
  
  // Si cambia a Completado, descontar materias primas e incrementar stock de producto terminado
  if (nuevoEstado === "Completado" && orden.estado !== "Completado") {
    const desglose = JSON.parse(orden.ingredientes_gramos);
    
    // 1. Descontar del inventario de materias primas
    desglose.forEach(ing => {
      registrarMovimientoInventario({
        ingrediente: ing.ingrediente,
        tipo_movimiento: "Consumo",
        cantidad_kg: -(ing.gramos / 1000), // Valor negativo para consumo
        costo_por_kg_usd: obtenerCostoPromedioMateriaPrima(ing.ingrediente),
        peso_real_verificado_kg: 0,
        diferencia_kg: 0,
        alerta_proveedor: "No"
      });
    });
    
    // 2. Incrementar stock del producto terminado
    const productos = readAll("Productos");
    const prod = productos.find(p => p.id === orden.producto_id);
    if (prod) {
      const stockActual = parseFloat(prod.stock_disponible || 0);
      const paquetes = parseFloat(orden.paquetes_requeridos);
      updateRow("Productos", prod.id, {
        "stock_disponible": stockActual + paquetes
      });
    }
  }
  
  // Actualizar el estado de la orden
  return updateRow("OrdenesProduccion", ordenId, { "estado": nuevoEstado });
}

/**
 * Registra una entrada de materia prima al almacén con auditoría de peso de sacos.
 * @param {Object} entrada Datos de la entrada (ingrediente, peso_nominal, peso_real, etc).
 */
function registrarEntradaInventario(entrada) {
  entrada.fecha_movimiento = entrada.fecha_movimiento || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  const pesoNominal = parseFloat(entrada.peso_nominal) || 0;
  const pesoReal = parseFloat(entrada.peso_real) || 0;
  const diferencia = pesoNominal - pesoReal;
  
  entrada.cantidad_kg = pesoReal;
  entrada.peso_real_verificado_kg = pesoReal;
  entrada.diferencia_kg = diferencia;
  entrada.tipo_movimiento = "Entrada";
  
  // Alerta si el saco pesa menos del 1% del peso nominal esperado
  const margenTolerado = pesoNominal * 0.01;
  if (diferencia > margenTolerado) {
    entrada.alerta_proveedor = "SÍ (Faltante: " + diferencia.toFixed(2) + " kg)";
    enviarAlertaMermaProveedor(entrada, pesoNominal);
  } else {
    entrada.alerta_proveedor = "No";
  }
  
  // Eliminar campos auxiliares antes de guardar
  delete entrada.peso_nominal;
  delete entrada.peso_real;
  
  return registrarMovimientoInventario(entrada);
}

/**
 * Registra cualquier movimiento directo en la hoja de Inventario.
 */
function registrarMovimientoInventario(movimiento) {
  movimiento.id = Utilities.getUuid();
  movimiento.fecha_movimiento = movimiento.fecha_movimiento || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  return createRow("Inventario", movimiento);
}

/**
 * Módulo de Asignación Fija para Harina de Mesa (Consumos indirectos en planta).
 */
function registrarAsignacionHarinaMesa(cantidadKg, descripcion) {
  return registrarMovimientoInventario({
    ingrediente: "Harina de Mesa / Espolvorear",
    tipo_movimiento: "Consumo Indirecto",
    cantidad_kg: -Math.abs(parseFloat(cantidadKg)),
    costo_por_kg_usd: obtenerCostoPromedioMateriaPrima("Harina"),
    peso_real_verificado_kg: 0,
    diferencia_kg: 0,
    alerta_proveedor: "No"
  });
}

/**
 * Envía una alerta si un saco llega incompleto de planta.
 */
function enviarAlertaMermaProveedor(entrada, pesoNominal) {
  const destinatarios = GERENCIA_EMAILS.join(",");
  const subject = "⚠️ ALERTA DE PÉRDIDA: Sacos con faltante de peso - Planta Degusta y Disfruta";
  const body = `
  Se ha detectado un faltante de peso al verificar materia prima ingresada.
  
  Detalles del Reporte:
  - Ingrediente: ${entrada.ingrediente}
  - Peso Nominal Esperado: ${pesoNominal} kg
  - Peso Real Verificado en Balanza: ${entrada.peso_real_verificado_kg} kg
  - Pérdida / Faltante: ${entrada.diferencia_kg.toFixed(2)} kg (Alerta Activada)
  - Costo Asociado por kg: $${entrada.costo_por_kg_usd} USD
  `;
  
  try {
    MailApp.sendEmail(destinatarios, subject, body);
  } catch (e) {
    Logger.log("Error enviando alerta de pesaje: " + e.toString());
  }
}

/**
 * Helper para obtener el costo promedio de una materia prima.
 */
function obtenerCostoPromedioMateriaPrima(ingrediente) {
  const inv = readAll("Inventario");
  const entradas = inv.filter(i => i.ingrediente.toLowerCase() === ingrediente.toLowerCase() && i.tipo_movimiento === "Entrada");
  
  if (entradas.length === 0) return 1.5; // Costo por defecto
  
  let sumaCostos = 0;
  let totalKg = 0;
  
  entradas.forEach(e => {
    const cant = parseFloat(e.cantidad_kg);
    const costo = parseFloat(e.costo_por_kg_usd);
    if (!isNaN(cant) && !isNaN(costo) && cant > 0) {
      sumaCostos += (cant * costo);
      totalKg += cant;
    }
  });
  
  return totalKg > 0 ? (sumaCostos / totalKg) : 1.5;
}
