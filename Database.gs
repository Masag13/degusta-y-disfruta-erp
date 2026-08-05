/**
 * Database.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Este archivo gestiona la persistencia de datos en Google Sheets.
 * Proporciona inicialización automática y operaciones CRUD genéricas.
 */

// ID de la hoja de cálculo de base de datos vinculada
const SPREADSHEET_ID = "17FuHU3wKdHqf3folN17O0yHlulv2HKt7qGd5jkSyR50";

// Estructura de las tablas y sus encabezados
const SCHEMAS = {
  "Egresos": ["id", "fecha", "proveedor", "categoria", "descripcion", "monto_usd", "monto_ves", "tasa_oficial", "foto_soporte_url", "cuenta_origen", "estado_aprobacion"],
  "Clientes": ["id", "nombre", "telefono", "direccion", "cestas_deudas"],
  "Ventas": ["id", "fecha", "cliente_id", "productos", "monto_usd", "monto_ves", "tasa_oficial", "estado_cobro", "pdf_url"],
  "Productos": ["id", "nombre", "unidad_empaque", "peso_por_unidad_g", "costo_usd", "precio_venta_usd", "stock_disponible"],
  "Recetas": ["id", "producto_id", "ingrediente", "porcentaje_panadero"],
  "OrdenesProduccion": ["id", "fecha", "producto_id", "paquetes_requeridos", "masa_total_kg", "ingredientes_gramos", "estado"],
  "Inventario": ["id", "fecha_movimiento", "ingrediente", "tipo_movimiento", "cantidad_kg", "costo_por_kg_usd", "peso_real_verificado_kg", "diferencia_kg", "alerta_proveedor"],
  "Cestas": ["id", "fecha", "tipo_movimiento", "chofer", "cliente_id", "cantidad"]
};

/**
 * Obtiene la hoja de cálculo vinculada mediante su ID explícito.
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Inicializa la base de datos creando las hojas correspondientes con sus encabezados si no existen.
 */
function initDatabase() {
  const ss = getSpreadsheet();
  
  for (const sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Escribir encabezados
      const headers = SCHEMAS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
      sheet.setFrozenRows(1);
    }
  }
  
  // Eliminar la "Hoja 1" por defecto si existe y hay otras hojas
  const defaultSheet = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  return "Base de datos inicializada correctamente.";
}

/**
 * Retorna todos los registros de una tabla como un arreglo de objetos JS.
 */
function readAll(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const headers = SCHEMAS[sheetName];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  
  return values.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Crea un nuevo registro en la tabla especificada.
 */
function createRow(sheetName, data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("La tabla " + sheetName + " no existe.");
  
  const headers = SCHEMAS[sheetName];
  
  // Generar ID único si no viene especificado
  if (!data.id) {
    data.id = Utilities.getUuid();
  }
  
  const rowValues = headers.map(header => {
    let val = data[header];
    if (val === undefined || val === null) {
      return "";
    }
    // Serializar objetos o arreglos a JSON para almacenarlos en celdas
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
    return val;
  });
  
  sheet.appendRow(rowValues);
  return data;
}

/**
 * Actualiza un registro existente por su ID.
 */
function updateRow(sheetName, id, data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("La tabla " + sheetName + " no existe.");
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("No hay registros para actualizar.");
  
  const headers = SCHEMAS[sheetName];
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(row => row[0]);
  
  const rowIndex = ids.indexOf(id);
  if (rowIndex === -1) throw new Error("Registro con ID " + id + " no encontrado.");
  
  const rowNum = rowIndex + 2; // +2 por encabezado y 1-based index
  
  // Leer los valores actuales de la fila para no sobreescribir con vacíos lo que no se envía
  const currentRange = sheet.getRange(rowNum, 1, 1, headers.length);
  const currentValues = currentRange.getValues()[0];
  
  const newRowValues = headers.map((header, index) => {
    if (data[header] !== undefined) {
      let val = data[header];
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    }
    return currentValues[index];
  });
  
  currentRange.setValues([newRowValues]);
  return data;
}

/**
 * Elimina físicamente un registro por su ID.
 */
function deleteRow(sheetName, id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("La tabla " + sheetName + " no existe.");
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(row => row[0]);
  const rowIndex = ids.indexOf(id);
  
  if (rowIndex === -1) return false;
  
  sheet.deleteRow(rowIndex + 2); // +2 por encabezado y 1-based index
  return true;
}
