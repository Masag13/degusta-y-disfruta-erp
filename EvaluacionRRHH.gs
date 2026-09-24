/**
 * Módulo de Evaluación de Recursos Humanos y Capacidades
 * Empresa: Degusta y Disfruta C.A.
 * 
 * Basado en los 4 valores corporativos:
 * 1. Competente (Saber Hacer / Habilidades Técnicas)
 * 2. Confiable (Calidad, Rigor y Consistencia)
 * 3. Compromiso (Iniciativa, Proactividad y Trabajo en Equipo)
 * 4. Responsable (Rendición de Cuentas y Cuidado de Activos)
 */

/**
 * FUNCIÓN 1: REPARAR LA MATRIZ EXISTENTE
 * Ejecuta esta función si ya creaste el formulario y la hoja de cálculo
 * para corregir los errores #REF! y alinear las columnas con las respuestas reales.
 */
function repararMatrizExistente() {
  // ID de la hoja actual reportada
  var sheetId = "1jMbL2l89ii6YN_DFHObztK0MZXBZ9qrW1SuNwD9w0Qw";
  var ss = SpreadsheetApp.openById(sheetId);
  
  // Buscar la hoja de respuestas (suele ser 'Respuestas de formulario 1' o 'Form Responses 1')
  var sheets = ss.getSheets();
  var formSheet = null;
  for (var s = 0; s < sheets.length; s++) {
    var name = sheets[s].getName();
    if (name.indexOf("Respuestas") !== -1 || name.indexOf("Responses") !== -1) {
      formSheet = sheets[s];
      break;
    }
  }
  
  if (!formSheet) {
    formSheet = sheets[0]; // Si no se encuentra por nombre, tomar la primera
  }
  
  var formSheetName = formSheet.getName();
  Logger.log("Hoja de respuestas detectada: " + formSheetName);

  // Obtener o crear la hoja de Matriz_Supervisor
  var hojaSup = ss.getSheetByName("Matriz_Supervisor");
  if (!hojaSup) {
    hojaSup = ss.insertSheet("Matriz_Supervisor");
  } else {
    hojaSup.clear(); // Limpiar fórmulas anteriores dañadas
  }

  // Encabezados
  var encabezados = [
    "ID", "Fecha", "Colaborador", "Cargo", "Departamento",
    "Auto: Competente (1-4)", "Supervisor: Competente (1-4)",
    "Auto: Confiable (1-4)", "Supervisor: Confiable (1-4)",
    "Auto: Compromiso (1-4)", "Supervisor: Compromiso (1-4)",
    "Auto: Responsable (1-4)", "Supervisor: Responsable (1-4)",
    "Promedio Auto", "Promedio Supervisor", "Brecha Global (Sup - Auto)",
    "Diagnóstico de Percepción", "Clasificación de Talento", "Acción de Seguimiento / Formación"
  ];
  
  hojaSup.appendRow(encabezados);
  hojaSup.getRange(1, 1, 1, encabezados.length)
    .setBackground("#1b5e20")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  hojaSup.setFrozenRows(1);

  // Columnas exactas de la hoja de respuestas:
  // A: Timestamp | B: Email | C: Nombre | D: Cargo | E: Depto | F: Antigüedad
  // G: Auto Competente | K: Auto Confiable | N: Auto Compromiso | Q: Auto Responsable
  
  for (var i = 2; i <= 35; i++) {
    var fPrefix = "'" + formSheetName + "'!";
    
    // Fórmulas de enlace a las respuestas del formulario
    var fFecha = "=IF(ISBLANK(" + fPrefix + "A" + i + "), \"\", " + fPrefix + "A" + i + ")";
    var fNombre = "=IF(ISBLANK(" + fPrefix + "C" + i + "), \"\", " + fPrefix + "C" + i + ")";
    var fCargo = "=IF(ISBLANK(" + fPrefix + "D" + i + "), \"\", " + fPrefix + "D" + i + ")";
    var fDepto = "=IF(ISBLANK(" + fPrefix + "E" + i + "), \"\", " + fPrefix + "E" + i + ")";
    
    var fAutoComp = "=IF(ISBLANK(" + fPrefix + "C" + i + "), \"\", " + fPrefix + "G" + i + ")";
    var fAutoConf = "=IF(ISBLANK(" + fPrefix + "C" + i + "), \"\", " + fPrefix + "K" + i + ")";
    var fAutoCompr = "=IF(ISBLANK(" + fPrefix + "C" + i + "), \"\", " + fPrefix + "N" + i + ")";
    var fAutoResp = "=IF(ISBLANK(" + fPrefix + "C" + i + "), \"\", " + fPrefix + "Q" + i + ")";
    
    // Fórmulas de cálculo del supervisor
    var fPromAuto = "=IF(ISBLANK(C" + i + "), \"\", AVERAGE(F" + i + ", H" + i + ", J" + i + ", L" + i + "))";
    var fPromSup = "=IF(OR(ISBLANK(C" + i + "), ISBLANK(G" + i + ")), \"\", AVERAGE(G" + i + ", I" + i + ", K" + i + ", M" + i + "))";
    var fBrecha = "=IF(OR(ISBLANK(N" + i + "), ISBLANK(O" + i + ")), \"\", O" + i + " - N" + i + ")";
    
    var fDiag = "=IF(ISBLANK(P" + i + "), \"\", IF(P" + i + " > 0.5, \"Modesto / Subestima su capacidad\", IF(P" + i + " < -0.5, \"Alerta / Sobrestima su capacidad\", \"Percepción Alineada\")))";
    var fClasif = "=IF(ISBLANK(O" + i + "), \"\", IF(O" + i + " >= 3.5, \"⭐ Alto Potencial / Promovible\", IF(O" + i + " >= 2.5, \"✅ Competente y Estable\", IF(O" + i + " >= 1.8, \"⚠️ En Desarrollo / Plan de Apoyo\", \"🚨 Brecha Crítica / Capacitación Urgente\"))))";
    
    hojaSup.getRange(i, 1).setValue(i - 1);
    hojaSup.getRange(i, 2).setFormula(fFecha);
    hojaSup.getRange(i, 3).setFormula(fNombre);
    hojaSup.getRange(i, 4).setFormula(fCargo);
    hojaSup.getRange(i, 5).setFormula(fDepto);
    
    hojaSup.getRange(i, 6).setFormula(fAutoComp);
    hojaSup.getRange(i, 8).setFormula(fAutoConf);
    hojaSup.getRange(i, 10).setFormula(fAutoCompr);
    hojaSup.getRange(i, 12).setFormula(fAutoResp);
    
    hojaSup.getRange(i, 14).setFormula(fPromAuto);
    hojaSup.getRange(i, 15).setFormula(fPromSup);
    hojaSup.getRange(i, 16).setFormula(fBrecha);
    hojaSup.getRange(i, 17).setFormula(fDiag);
    hojaSup.getRange(i, 18).setFormula(fClasif);
  }

  // Resaltar en color amarillo suave las celdas donde el supervisor debe ingresar sus notas
  hojaSup.getRange("G2:G35").setBackground("#fff2cc");
  hojaSup.getRange("I2:I35").setBackground("#fff2cc");
  hojaSup.getRange("K2:K35").setBackground("#fff2cc");
  hojaSup.getRange("M2:M35").setBackground("#fff2cc");
  hojaSup.getRange("S2:S35").setBackground("#fff2cc");

  hojaSup.autoResizeColumns(1, encabezados.length);

  Logger.log("✅ Matriz reparada exitosamente en la hoja: " + ss.getUrl());
}

/**
 * FUNCIÓN 2: GENERAR EVALUACIÓN DESDE CERO
 */
function generarEvaluacionCompletaRRHH() {
  var form = FormApp.create("Inventario de Capacidades y Evaluación de Talento - Degusta y Disfruta C.A.");
  
  form.setDescription(
    "Bienvenido al proceso de diagnóstico y evaluación de capacidades de Degusta y Disfruta C.A.\n\n" +
    "El objetivo es identificar las fortalezas técnicas de cada miembro del equipo y su alineación con nuestros 4 valores corporativos: Competente, Confiable, Compromiso y Responsable.\n\n" +
    "📌 ESCALA DE EVALUACIÓN (1 al 4):\n" +
    "• Nivel 1 (Básico / En desarrollo): Conozco la teoría o lo básico, requiero supervisión y apoyo constante.\n" +
    "• Nivel 2 (Intermedio / Autónomo): Ejecuto mis funciones rutinarias con precisión y autonomía.\n" +
    "• Nivel 3 (Avanzado / Sobresaliente): Domino el área, resuelvo incidencias complejas y apoyo a compañeros.\n" +
    "• Nivel 4 (Experto / Formador): Soy referente técnico, diseño metodologías o capacito a otros."
  );

  form.setAllowResponseEdits(false);
  form.setCollectEmail(true);

  // Sección 1
  form.addSectionHeaderItem().setTitle("1. Datos de Identificación y Puesto de Trabajo");
  form.addTextItem().setTitle("Nombre y Apellido").setRequired(true);
  
  var qCargo = form.addListItem().setTitle("Cargo Actual").setRequired(true);
  qCargo.setChoiceValues([
    "Gerencia General / Dirección",
    "Gerencia de Producción",
    "Maestro Panadero / Hornero",
    "Operario de Planta / Producción",
    "Administración y Facturación",
    "Logística, Almacén y Despacho",
    "Comercial, Ventas y Redes",
    "Mantenimiento e Infraestructura",
    "Otro"
  ]);

  var qDepto = form.addListItem().setTitle("Área o Departamento").setRequired(true);
  qDepto.setChoiceValues([
    "Producción y Planta",
    "Administración y Finanzas",
    "Logística y Despacho",
    "Mercadeo y Ventas",
    "Dirección"
  ]);

  var qAntiguedad = form.addMultipleChoiceItem().setTitle("Antigüedad en la empresa").setRequired(true);
  qAntiguedad.setChoiceValues(["Menos de 6 meses", "6 meses a 1 año", "1 a 3 años", "Más de 3 años"]);

  // Sección 2
  form.addPageBreakItem().setTitle("2. Pilar: COMPETENTE (Saber Hacer y Destreza Técnica)");
  form.addScaleItem().setTitle("¿Cuál es tu nivel general de dominio técnico en tus tareas y funciones principales?").setBounds(1, 4).setLabels("1 (Básico)", "4 (Experto)").setRequired(true);
  form.addParagraphTextItem().setTitle("¿Qué maquinarias de planta, herramientas o procesos dominas con total autonomía?").setRequired(true);
  form.addParagraphTextItem().setTitle("¿Ante qué problemas técnicos o dudas específicas acuden tus compañeros a ti?").setRequired(false);
  form.addParagraphTextItem().setTitle("¿Posees certificaciones, cursos técnicos o certificados de manipulación de alimentos?").setRequired(false);

  // Sección 3
  form.addPageBreakItem().setTitle("3. Pilar: CONFIABLE (Calidad, Consistencia y Rigor)");
  form.addScaleItem().setTitle("¿En qué nivel calificas la consistencia y exactitud en tus entregas sin requerir correcciones?").setBounds(1, 4).setLabels("1 (Revisiones frecuentes)", "4 (Cero errores)").setRequired(true);
  form.addParagraphTextItem().setTitle("¿Qué métodos aplicas para asegurar la calidad antes de entregar tu trabajo?").setRequired(true);
  form.addParagraphTextItem().setTitle("¿En qué tareas críticas o manejo de información sientes que la empresa puede delegarte total confianza?").setRequired(false);

  // Sección 4
  form.addPageBreakItem().setTitle("4. Pilar: COMPROMISO (Iniciativa, Proactividad y Metas)");
  form.addScaleItem().setTitle("¿Cómo calificas tu disposición para colaborar voluntariamente y alcanzar metas en equipo?").setBounds(1, 4).setLabels("1 (Lo básico)", "4 (Alta proactividad)").setRequired(true);
  form.addParagraphTextItem().setTitle("¿Qué propuesta de mejora o ahorro has aportado o te gustaría implementar?").setRequired(true);
  form.addParagraphTextItem().setTitle("¿Cómo reaccionas cuando surge una contingencia en planta y se requiere apoyo extra?").setRequired(false);

  // Sección 5
  form.addPageBreakItem().setTitle("5. Pilar: RESPONSABLE (Rendición de Cuentas y Cuidado de Activos)");
  form.addScaleItem().setTitle("¿Cuál es tu nivel de cumplimiento en tiempos, normas y cuidado de bienes (equipos, insumos, cestas)?").setBounds(1, 4).setLabels("1 (Ocasionalmente demorado)", "4 (Protector de activos)").setRequired(true);
  form.addParagraphTextItem().setTitle("Cuando ocurre un error involuntario, ¿cuáles son los pasos que sigues para solucionarlo?").setRequired(true);
  form.addParagraphTextItem().setTitle("¿De qué manera cuidas activamente los recursos de la empresa?").setRequired(false);

  // Sección 6
  form.addPageBreakItem().setTitle("6. Proyección Profesional y Capacitación");
  form.addParagraphTextItem().setTitle("¿Qué habilidades técnicas o cursos te gustaría aprender en los próximos 6 meses?").setRequired(true);
  form.addParagraphTextItem().setTitle("¿Hacia qué rol o nivel de responsabilidad te gustaría proyectarte?").setRequired(false);

  // Crear la hoja de cálculo
  var ss = SpreadsheetApp.create("Matriz y Control de Evaluación RRHH - Degusta y Disfruta");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log("✅ Formulario: " + form.getPublishedUrl());
  Logger.log("📊 Hoja de Cálculo: " + ss.getUrl());
}
