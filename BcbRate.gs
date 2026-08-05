/**
 * BcbRate.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Gestiona la obtención automática del tipo de cambio oficial del BCB.
 */

/**
 * Obtiene la tasa de cambio oficial del BCB (USD a VES).
 * Intenta primero la API de DolarAPI (Oficial) y luego realiza scraping directo al BCB.
 * Retorna un valor numérico.
 */
function getBcbRate() {
  // 1. Intentar con DolarAPI (Oficial)
  try {
    const urlApi = "https://ve.dolarapi.com/v1/dolares/oficial";
    const response = UrlFetchApp.fetch(urlApi, {
      muteHttpExceptions: true,
      timeoutInMilliseconds: 5000
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data && data.promedio) {
        const rate = parseFloat(data.promedio);
        if (!isNaN(rate) && rate > 0) {
          Logger.log("Tasa BCB obtenida de DolarAPI: " + rate);
          return rate;
        }
      }
    }
  } catch (e) {
    Logger.log("Error al consultar DolarAPI: " + e.toString());
  }

  // 2. Intentar raspado directo del portal oficial del BCB
  try {
    const urlBcb = "https://www.bcb.org.ve/";
    const response = UrlFetchApp.fetch(urlBcb, {
      muteHttpExceptions: true,
      validateHttpsCertificates: false,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeoutInMilliseconds: 8000
    });

    if (response.getResponseCode() === 200) {
      const html = response.getContentText();
      
      // Buscar la sección de id="dolar" y extraer el número formateado (ej: 36,5432)
      const matchDolar = html.match(/id="dolar"[\s\S]*?<strong>\s*([0-9.,]+)\s*<\/strong>/i);
      if (matchDolar && matchDolar[1]) {
        const rawValue = matchDolar[1].trim();
        // Convertir coma decimal a punto
        const rate = parseFloat(rawValue.replace(/\./g, "").replace(",", "."));
        if (!isNaN(rate) && rate > 0) {
          Logger.log("Tasa BCB obtenida por Scraping: " + rate);
          return rate;
        }
      }
      
      // Regex alternativo más flexible buscando cualquier decimal cerca de "dolar"
      const matchAlt = html.match(/dolar[\s\S]*?([0-9]+,[0-9]+)/i);
      if (matchAlt && matchAlt[1]) {
        const rate = parseFloat(matchAlt[1].replace(",", "."));
        if (!isNaN(rate) && rate > 0) {
          Logger.log("Tasa BCB obtenida por Scraping Alternativo: " + rate);
          return rate;
        }
      }
    }
  } catch (e) {
    Logger.log("Error al realizar Scraping en BCB: " + e.toString());
  }

  // 3. Fallback en caso de falla de ambos servicios (obtiene la última registrada en Ventas o Egresos, o 36.5 de base)
  Logger.log("Fallo la obtención automática de la tasa. Buscando último registro en base de datos...");
  try {
    const ventas = readAll("Ventas");
    if (ventas.length > 0) {
      const ultimaVenta = ventas[ventas.length - 1];
      const rate = parseFloat(ultimaVenta.tasa_oficial);
      if (!isNaN(rate) && rate > 0) return rate;
    }
  } catch (err) {
    Logger.log("Error leyendo última tasa de Ventas: " + err.toString());
  }

  // Valor de contingencia por defecto
  return 36.5;
}
