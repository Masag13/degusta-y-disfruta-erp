/**
 * Ventas.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Gestiona el catálogo de ventas, cálculo de montos con tasa BCB,
 * generación de notas de entrega en formato PDF y control de cuentas por cobrar.
 */

/**
 * Registra una venta, calcula los montos en VES, genera el PDF y actualiza inventarios de productos.
 * @param {Object} venta Datos de la venta (cliente_id, productos: [{id, cantidad, precio_unitario}], etc).
 */
function registrarVenta(venta) {
  const tasa = getBcbRate();
  venta.tasa_oficial = tasa;
  
  if (!venta.fecha) {
    venta.fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  
  // Buscar información del cliente
  const clientes = readAll("Clientes");
  const cliente = clientes.find(c => c.id === venta.cliente_id) || { nombre: "Cliente Particular", telefono: "", direccion: "" };
  
  // Parsear productos si viene en string
  let items = [];
  if (typeof venta.productos === "string") {
    items = JSON.parse(venta.productos);
  } else {
    items = venta.productos;
  }
  
  // Calcular total en USD
  let totalUsd = 0;
  items.forEach(item => {
    totalUsd += (item.cantidad * item.precio_unitario);
  });
  
  venta.monto_usd = totalUsd.toFixed(2);
  venta.monto_ves = (totalUsd * tasa).toFixed(2);
  venta.estado_cobro = "Pendiente";
  
  // Registrar la venta en Google Sheets para obtener el ID de registro
  venta.id = Utilities.getUuid();
  
  // Generar nota de entrega PDF de forma programática
  try {
    const pdfUrl = generarNotaEntregaPDF(venta, cliente, items);
    venta.pdf_url = pdfUrl;
  } catch (e) {
    Logger.log("Error generando PDF de Nota de Entrega: " + e.toString());
    venta.pdf_url = "Error en PDF: " + e.toString();
  }
  
  // Descontar inventario disponible de productos
  descontarStockProductos(items);
  
  return createRow("Ventas", venta);
}

/**
 * Genera de forma programática un documento de Google Docs con la Nota de Entrega,
 * lo exporta a PDF, lo guarda en Drive y elimina el documento temporal.
 */
function generarNotaEntregaPDF(venta, cliente, items) {
  // 1. Obtener o crear carpeta "Notas_de_Entrega" en Drive
  let folder;
  const folders = DriveApp.getFoldersByName("Notas_de_Entrega");
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder("Notas_de_Entrega");
  }
  
  // 2. Crear documento temporal de Docs
  const docTitle = "Nota_Entrega_" + venta.fecha.replace(/-/g, "") + "_" + cliente.nombre.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const tempDoc = DocumentApp.create(docTitle);
  const docId = tempDoc.getId();
  const body = tempDoc.getBody();
  
  // Estilo y espaciado de página
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(36);
  body.setMarginRight(36);
  
  // Cabecera institucional
  const headerStyle = {};
  headerStyle[DocumentApp.Attribute.FONT_FAMILY] = "Courier New";
  headerStyle[DocumentApp.Attribute.FONT_SIZE] = 10;
  
  const titleP = body.appendParagraph("DEGUSTA Y DISFRUTA C.A.");
  titleP.setFontSize(16).setFontFamily("Trebuchet MS").setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  const rifP = body.appendParagraph("RIF: J-50478129-3\nDirección: Planta Industrial Degusta y Disfruta, Edo. Nueva Esparta\nTeléfono: +58 412-1234567\nEmail: administracion@degustaydisfruta.com");
  rifP.setFontSize(8).setFontFamily("Arial").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph("________________________________________________________________________________").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  // Título del documento
  const subTitleP = body.appendParagraph("NOTA DE ENTREGA N° " + venta.id.substring(0, 8).toUpperCase());
  subTitleP.setFontSize(12).setFontFamily("Arial").setBold(true).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  
  // Datos del Cliente y Factura
  const infoTableValues = [
    ["FECHA DE EMISIÓN:", venta.fecha, "ESTADO:", venta.estado_cobro.toUpperCase()],
    ["CLIENTE:", cliente.nombre, "RIF/C.I.:", cliente.rif || "V-00000000"],
    ["TELÉFONO:", cliente.telefono, "TASA OFICIAL BCB:", "Bs. " + venta.tasa_oficial.toFixed(4)],
    ["DIRECCIÓN:", cliente.direccion || "N/D", "", ""]
  ];
  
  const infoTable = body.appendTable(infoTableValues);
  infoTable.setBorderWidth(0);
  
  // Espacio
  body.appendParagraph("");
  
  // Tabla de Productos
  const tableData = [
    ["PRODUCTO", "CANTIDAD", "P. UNITARIO ($)", "TOTAL ($)"]
  ];
  
  items.forEach(item => {
    const subtotal = item.cantidad * item.precio_unitario;
    tableData.push([
      item.nombre,
      item.cantidad.toString(),
      "$" + item.precio_unitario.toFixed(2),
      "$" + subtotal.toFixed(2)
    ]);
  });
  
  const totalVesFormatted = "Bs. " + parseFloat(venta.monto_ves).toLocaleString("es-VE", { minimumFractionDigits: 2 });
  const totalUsdFormatted = "$" + parseFloat(venta.monto_usd).toLocaleString("en-US", { minimumFractionDigits: 2 });
  
  tableData.push(["TOTAL EN DÓLARES (USD):", "", "", totalUsdFormatted]);
  tableData.push(["TOTAL EN BOLÍVARES (VES):", "", "", totalVesFormatted]);
  
  const itemsTable = body.appendTable(tableData);
  itemsTable.setBorderWidth(1);
  itemsTable.setBorderColor("#cbd5e1");
  
  // Formatear tabla de productos
  for (let i = 0; i < tableData.length; i++) {
    const row = itemsTable.getRow(i);
    // Encabezado de la tabla
    if (i === 0) {
      for (let j = 0; j < 4; j++) {
        row.getCell(j).setBackgroundColor("#1e293b").setFontColor("#ffffff").setBold(true);
      }
    } 
    // Totales
    else if (i >= tableData.length - 2) {
      row.getCell(0).setBold(true);
      row.getCell(3).setBold(true);
      row.getCell(0).setBackgroundColor("#f8fafc");
      row.getCell(3).setBackgroundColor("#f8fafc");
    }
  }
  
  // Firmas de Recibido
  body.appendParagraph("\n\n\n\n");
  const signatures = [
    ["_____________________________\nEntregado por Planta\nDegusta y Disfruta", "_____________________________\nRecibido Conforme\nCliente / Transporte"]
  ];
  const sigTable = body.appendTable(signatures);
  sigTable.setBorderWidth(0);
  sigTable.getRow(0).getCell(0).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  sigTable.getRow(0).getCell(1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  // Guardar y cerrar Docs
  tempDoc.saveAndClose();
  
  // 3. Convertir a PDF
  const pdfBlob = DriveApp.getFileById(docId).getAs("application/pdf");
  pdfBlob.setName(docTitle + ".pdf");
  const pdfFile = folder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // 4. Mover el Doc temporal a la papelera
  DriveApp.getFileById(docId).setTrashed(true);
  
  return pdfFile.getUrl();
}

/**
 * Cruce Financiero: Registra un cobro parcial o total sobre una nota de entrega.
 */
function registrarPagoVenta(ventaId, montoPagadoUsd) {
  const ss = getSpreadsheet();
  const ventas = readAll("Ventas");
  const venta = ventas.find(v => v.id === ventaId);
  
  if (!venta) throw new Error("Venta no encontrada.");
  
  const montoUsd = parseFloat(venta.monto_usd);
  const montoAbonadoAnterior = parseFloat(venta.monto_abonado || 0);
  const nuevoAbono = montoAbonadoAnterior + parseFloat(montoPagadoUsd);
  
  let nuevoEstado = "Pendiente";
  if (nuevoAbono >= montoUsd - 0.05) { // Tolerancia por redondeo
    nuevoEstado = "Cobrado";
  } else if (nuevoAbono > 0) {
    nuevoEstado = "Abonado Parcial";
  }
  
  updateRow("Ventas", ventaId, {
    "monto_abonado": nuevoAbono.toFixed(2),
    "estado_cobro": nuevoEstado
  });
  
  return {
    success: true,
    nuevoEstado: nuevoEstado,
    montoAbonadoTotal: nuevoAbono
  };
}

/**
 * Descuenta el stock de productos terminados cuando se registra una venta.
 */
function descontarStockProductos(items) {
  const productos = readAll("Productos");
  
  items.forEach(item => {
    const prod = productos.find(p => p.id === item.id || p.nombre === item.nombre);
    if (prod) {
      const stockActual = parseFloat(prod.stock_disponible || 0);
      const nuevoStock = stockActual - parseFloat(item.cantidad);
      updateRow("Productos", prod.id, { "stock_disponible": nuevoStock });
    }
  });
}
