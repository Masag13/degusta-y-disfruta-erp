/**
 * Egresos.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Gestiona el registro de egresos, la carga y renombrado de comprobantes,
 * las aprobaciones automáticas y la exportación homologada para Fina.
 */

// Correos de la gerencia para aprobaciones
const GERENCIA_EMAILS = ["julio.cedeno@gmail.com", "humberto.silva@gmail.com"];

/**
 * Procesa y registra un egreso desde la aplicación móvil.
 * @param {Object} egreso Objeto con los datos del egreso.
 * @param {String} base64Image Imagen en formato base64 (opcional).
 * @param {String} imageMimeType Tipo MIME de la imagen (ej: "image/jpeg").
 */
function registrarEgreso(egreso, base64Image, imageMimeType) {
  // Asegurar que la fecha esté formateada correctamente
  if (!egreso.fecha) {
    egreso.fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  
  // Calcular conversión de divisas si falta una de ellas
  const tasa = getBcbRate();
  egreso.tasa_oficial = tasa;
  
  const montoUsd = parseFloat(egreso.monto_usd);
  const montoVes = parseFloat(egreso.monto_ves);
  
  if (isNaN(montoUsd) && !isNaN(montoVes)) {
    egreso.monto_usd = (montoVes / tasa).toFixed(2);
  } else if (!isNaN(montoUsd) && isNaN(montoVes)) {
    egreso.monto_ves = (montoUsd * tasa).toFixed(2);
  }
  
  // Guardar comprobante en Drive si viene la imagen
  if (base64Image) {
    try {
      const urlFoto = guardarComprobanteEnDrive(base64Image, imageMimeType, egreso.fecha, egreso.proveedor);
      egreso.foto_soporte_url = urlFoto;
    } catch (e) {
      Logger.log("Error guardando comprobante: " + e.toString());
      egreso.foto_soporte_url = "Error en carga: " + e.toString();
    }
  } else {
    egreso.foto_soporte_url = "";
  }
  
  // Flujo de aprobación para compras superiores a 100 USD
  const totalUsd = parseFloat(egreso.monto_usd) || 0;
  if (totalUsd > 100) {
    egreso.estado_aprobacion = "Pendiente";
    enviarSolicitudAprobacion(egreso);
  } else {
    egreso.estado_aprobacion = "Aprobado";
  }
  
  // Registrar en la base de datos
  return createRow("Egresos", egreso);
}

/**
 * Guarda un archivo base64 en la estructura de Google Drive: /Comprobantes_Egresos/YYYY-MM/
 * Renombra el archivo: EGRESO_YYYYMMDD_PROVEEDOR_ID.ext
 */
function guardarComprobanteEnDrive(base64Image, mimeType, fechaStr, proveedor) {
  // Limpiar el base64 de cabeceras de data URL
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType);
  
  // Formatear carpeta por año y mes (ej: 2026-08)
  const fechaPartes = fechaStr.split("-");
  const folderName = fechaPartes[0] + "-" + fechaPartes[1];
  
  // 1. Obtener o crear carpeta raíz "Comprobantes_Egresos"
  let rootFolder;
  const roots = DriveApp.getFoldersByName("Comprobantes_Egresos");
  if (roots.hasNext()) {
    rootFolder = roots.next();
  } else {
    rootFolder = DriveApp.createFolder("Comprobantes_Egresos");
  }
  
  // 2. Obtener o crear subcarpeta "YYYY-MM"
  let subFolder;
  const subs = rootFolder.getFoldersByName(folderName);
  if (subs.hasNext()) {
    subFolder = subs.next();
  } else {
    subFolder = rootFolder.createFolder(folderName);
  }
  
  // 3. Crear nombre del archivo: EGRESO_YYYYMMDD_PROVEEDOR_UUID
  const yyyymmdd = fechaStr.replace(/-/g, "");
  const cleanProveedor = proveedor.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const uniqueId = Utilities.getUuid().substring(0, 4);
  const ext = mimeType.split("/")[1] || "jpg";
  const fileName = "EGRESO_" + yyyymmdd + "_" + cleanProveedor + "_" + uniqueId + "." + ext;
  
  // 4. Crear archivo en Drive
  blob.setName(fileName);
  const file = subFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

/**
 * Envía una notificación de correo para solicitar aprobación de un egreso > 100 USD.
 */
function enviarSolicitudAprobacion(egreso) {
  const adminEmail = Session.getActiveUser().getEmail();
  const destinatarios = GERENCIA_EMAILS.concat([adminEmail]).join(",");
  
  const subject = "⚠️ SOLICITUD DE APROBACIÓN: Egreso Mayor a $100 USD - Degusta y Disfruta";
  const body = `
  Se ha registrado un gasto que requiere aprobación gerencial.
  
  Detalles del Egreso:
  - Proveedor: ${egreso.proveedor}
  - Categoría: ${egreso.categoria}
  - Descripción: ${egreso.descripcion}
  - Monto USD: $${egreso.monto_usd} USD
  - Monto VES: Bs. ${egreso.monto_ves} VES (Tasa: ${egreso.tasa_oficial})
  - Cuenta de Origen: ${egreso.cuenta_origen}
  - Foto Soporte: ${egreso.foto_soporte_url || "No adjunta"}
  
  Para aprobar o rechazar este gasto, por favor ingresa al Portal Administrativo de Degusta y Disfruta.
  `;
  
  try {
    MailApp.sendEmail(destinatarios, subject, body);
    Logger.log("Correo de aprobación enviado a: " + destinatarios);
  } catch (e) {
    Logger.log("Error enviando correo de aprobación: " + e.toString());
  }
}

/**
 * Aprueba un egreso que estaba pendiente de aprobación.
 */
function aprobarEgreso(id) {
  return updateRow("Egresos", id, { "estado_aprobacion": "Aprobado" });
}

/**
 * Rechaza o anula un egreso.
 */
function rechazarEgreso(id) {
  return updateRow("Egresos", id, { "estado_aprobacion": "Rechazado" });
}

/**
 * Exporta los egresos aprobados formateados para la importación masiva en el sistema contable Fina.
 * Crea una nueva hoja llamada "Export_Fina_Egresos" con el formato correspondiente.
 */
function exportEgresosToFina() {
  const ss = getSpreadsheet();
  let exportSheet = ss.getSheetByName("Export_Fina_Egresos");
  
  if (exportSheet) {
    exportSheet.clear();
  } else {
    exportSheet = ss.insertSheet("Export_Fina_Egresos");
  }
  
  // Encabezados requeridos por Fina (Estructura típica de importación de diario/egresos)
  const FINA_HEADERS = ["Fecha", "Comprobante", "Cuenta Debito", "Cuenta Credito", "Monto USD", "Monto VES", "Tasa", "Detalle/Beneficiario", "Referencia Documento"];
  exportSheet.getRange(1, 1, 1, FINA_HEADERS.length).setValues([FINA_HEADERS]).setFontWeight("bold");
  
  const egresos = readAll("Egresos").filter(e => e.estado_aprobacion === "Aprobado");
  
  if (egresos.length === 0) {
    return "No hay egresos aprobados para exportar.";
  }
  
  const exportRows = egresos.map(e => {
    // Mapeo simple de categorías a cuentas contables simuladas
    let cuentaDebito = "6.1.01.01 (Gastos Operativos)";
    if (e.categoria === "Materia Prima") cuentaDebito = "1.1.03.01 (Inventario Materia Prima)";
    else if (e.categoria === "Mantenimiento/Infraestructura") cuentaDebito = "6.1.02.04 (Mantenimiento Planta)";
    else if (e.categoria === "Servicios") cuentaDebito = "6.1.03.01 (Servicios Públicos)";
    
    let cuentaCredito = "1.1.01.01 (Caja Chica)";
    if (e.cuenta_origen.indexOf("Banesco") > -1) cuentaCredito = "1.1.02.01 (Banesco)";
    else if (e.cuenta_origen.indexOf("Banca Amiga") > -1) cuentaCredito = "1.1.02.02 (Banca Amiga)";
    else if (e.cuenta_origen.indexOf("Venezuela") > -1) cuentaCredito = "1.1.02.03 (Banco de Venezuela)";
    
    return [
      e.fecha,
      "EGRESO-" + e.id.substring(0, 8).toUpperCase(),
      cuentaDebito,
      cuentaCredito,
      e.monto_usd,
      e.monto_ves,
      e.tasa_oficial,
      e.proveedor + " - " + e.descripcion,
      e.foto_soporte_url ? "Ver soporte: " + e.foto_soporte_url : "S/S"
    ];
  });
  
  exportSheet.getRange(2, 1, exportRows.length, FINA_HEADERS.length).setValues(exportRows);
  return "Se exportaron " + exportRows.length + " egresos a la pestaña Export_Fina_Egresos.";
}
