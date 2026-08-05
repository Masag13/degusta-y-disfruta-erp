/**
 * Cestas.gs - Ecosistema Digital Degusta y Disfruta C.A.
 * 
 * Gestiona el control de entradas y salidas de cestas de despacho plásticas por cliente y chofer.
 */

/**
 * Registra un movimiento de cestas y recalcula el saldo adeudado por el cliente.
 * @param {Object} mov Movimiento (cliente_id, tipo_movimiento: Salida/Retorno, chofer, cantidad).
 */
function registrarMovimientoCestas(mov) {
  mov.id = Utilities.getUuid();
  mov.fecha = mov.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  mov.cantidad = Math.abs(parseInt(mov.cantidad));
  
  // Guardar en la tabla Cestas
  const nuevoRegistro = createRow("Cestas", mov);
  
  // Recalcular saldo total para el cliente
  recalcularSaldoCestasCliente(mov.cliente_id);
  
  return nuevoRegistro;
}

/**
 * Recalcula y actualiza la cantidad de cestas adeudadas de un cliente específico.
 */
function recalcularSaldoCestasCliente(clienteId) {
  const movimientos = readAll("Cestas").filter(m => m.cliente_id === clienteId);
  
  let balance = 0;
  movimientos.forEach(m => {
    const cant = parseInt(m.cantidad) || 0;
    if (m.tipo_movimiento === "Salida") {
      balance += cant;
    } else if (m.tipo_movimiento === "Retorno") {
      balance -= cant;
    }
  });
  
  // Actualizar en la tabla de Clientes
  updateRow("Clientes", clienteId, {
    "cestas_deudas": balance
  });
  
  // Generar alerta de recuperación si supera 50 cestas
  if (balance >= 50) {
    enviarAlertaCestasPendientes(clienteId, balance);
  }
  
  return balance;
}

/**
 * Envía una alerta por correo sobre un cliente con alta acumulación de cestas pendientes de retorno.
 */
function enviarAlertaCestasPendientes(clienteId, balance) {
  const clientes = readAll("Clientes");
  const cliente = clientes.find(c => c.id === clienteId) || { nombre: "Cliente Desconocido" };
  const destinatarios = GERENCIA_EMAILS.join(",");
  
  const subject = "⚠️ ALERTA DE ACTIVOS: " + cliente.nombre + " supera límite de cestas adeudadas";
  const body = `
  El cliente ${cliente.nombre} ha alcanzado un saldo de ${balance} cestas plásticas de despacho pendientes de retorno.
  
  Por favor, coordine con el Sr. Gallardo o Jorge para programar la recolección física en la próxima ruta.
  `;
  
  try {
    MailApp.sendEmail(destinatarios, subject, body);
  } catch (e) {
    Logger.log("Error enviando alerta de cestas: " + e.toString());
  }
}
