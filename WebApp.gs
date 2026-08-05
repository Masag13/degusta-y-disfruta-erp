/**
 * WebApp.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Controlador de la aplicación web única (SPA) y pasarela de comunicación (API).
 */

/**
 * Sirve el frontend (index.html) al acceder al enlace web del script.
 */
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || "index";
  // Configurar metadatos y políticas de seguridad
  const htmlOutput = HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle("Portal Administrativo - Degusta y Disfruta C.A.")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
    
  return htmlOutput;
}

/**
 * Helper para incluir archivos html en otros archivos html (ej: css, js).
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ==========================================================================
   PASARELA DE APIS PARA LA COMUNICACIÓN CLIENTE-SERVIDOR (google.script.run)
   ========================================================================== */

function apiInitDatabase() {
  return initDatabase();
}

function apiReadAll(sheetName) {
  try {
    return readAll(sheetName);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiCreateRow(sheetName, data) {
  try {
    return createRow(sheetName, data);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiUpdateRow(sheetName, id, data) {
  try {
    return updateRow(sheetName, id, data);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiDeleteRow(sheetName, id) {
  try {
    return deleteRow(sheetName, id);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiGetBcbRate() {
  try {
    return getBcbRate();
  } catch (e) {
    return 36.5;
  }
}

function apiRegistrarEgreso(egreso, base64Image, imageMimeType) {
  try {
    return registrarEgreso(egreso, base64Image, imageMimeType);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiAprobarEgreso(id) {
  try {
    return aprobarEgreso(id);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRechazarEgreso(id) {
  try {
    return rechazarEgreso(id);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiExportEgresosToFina() {
  try {
    return exportEgresosToFina();
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRegistrarVenta(venta) {
  try {
    return registrarVenta(venta);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRegistrarPagoVenta(ventaId, montoPagadoUsd) {
  try {
    return registrarPagoVenta(ventaId, montoPagadoUsd);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiCalcularOrdenProduccion(productoId, paquetes) {
  try {
    return calcularOrdenProduccion(productoId, paquetes);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiCrearOrdenProduccion(orden) {
  try {
    return crearOrdenProduccion(orden);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiActualizarEstadoOrden(ordenId, nuevoEstado) {
  try {
    return actualizarEstadoOrden(ordenId, nuevoEstado);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRegistrarEntradaInventario(entrada) {
  try {
    return registrarEntradaInventario(entrada);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRegistrarAsignacionHarinaMesa(cantidadKg, descripcion) {
  try {
    return registrarAsignacionHarinaMesa(cantidadKg, descripcion);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRecalcularTodosLosCostos() {
  try {
    return recalcularTodosLosCostos();
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiSimularPrecioVenta(productoId, margenDeseadoPorcentaje) {
  try {
    return simularPrecioVenta(productoId, margenDeseadoPorcentaje);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiActualizarPrecioYStock(productoId, precioUsd, stock) {
  try {
    return actualizarPrecioYStock(productoId, precioUsd, stock);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiRegistrarMovimientoCestas(mov) {
  try {
    return registrarMovimientoCestas(mov);
  } catch (e) {
    throw new Error(e.toString());
  }
}

function apiGetDashboardKPIs() {
  try {
    const egresos = readAll("Egresos");
    const ventas = readAll("Ventas");
    const inventario = readAll("Inventario");
    const clientes = readAll("Clientes");
    
    // Ventas del día en USD
    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const ventasHoy = ventas.filter(v => v.fecha === hoy);
    const totalVentasHoyUSD = ventasHoy.reduce((acc, v) => acc + (parseFloat(v.monto_usd) || 0), 0);
    
    // Cuentas por cobrar vencidas/pendientes
    const pendientesCobroUSD = ventas
      .filter(v => v.estado_cobro === "Pendiente" || v.estado_cobro === "Abonado Parcial")
      .reduce((acc, v) => acc + ((parseFloat(v.monto_usd) || 0) - (parseFloat(v.monto_abonado) || 0)), 0);
      
    // Cestas en la calle
    const totalCestasCalle = clientes.reduce((acc, c) => acc + (parseInt(c.cestas_deudas) || 0), 0);
    
    // Egresos del mes
    const mesActual = hoy.substring(0, 7); // YYYY-MM
    const egresosMes = egresos.filter(e => e.fecha.startsWith(mesActual) && e.estado_aprobacion === "Aprobado");
    const totalEgresosMesUSD = egresosMes.reduce((acc, e) => acc + (parseFloat(e.monto_usd) || 0), 0);
    
    return {
      ventasHoyUSD: totalVentasHoyUSD.toFixed(2),
      pendientesCobroUSD: pendientesCobroUSD.toFixed(2),
      cestasCalle: totalCestasCalle,
      egresosMesUSD: totalEgresosMesUSD.toFixed(2),
      tasaBcb: getBcbRate()
    };
  } catch (e) {
    return {
      ventasHoyUSD: "0.00",
      pendientesCobroUSD: "0.00",
      cestasCalle: 0,
      egresosMesUSD: "0.00",
      tasaBcb: 36.5
    };
  }
}
