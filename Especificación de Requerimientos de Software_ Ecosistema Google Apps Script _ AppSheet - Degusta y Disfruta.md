# **ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE**

### **Ecosistema Digital Integrado Google Apps Script / AppSheet para Degusta y Disfruta C.A.**

**Empresa:** Degusta y Disfruta C.A.

**Plataforma Base:** Google Workspace (Apps Script, AppSheet, Google Sheets, Google Drive, Looker Studio)

**Elaborado para:** Julio Cedeño, Humberto Silva y Diego Cedeño (Equipo Directivo y Administrativo)

**Versión:** 1.0 (Basado en acuerdos de planificación y operaciones del 3 y 4 de agosto de 2026\)

## **1\. INTRODUCCIÓN Y OBJETIVO GENERAL**

---

El presente documento define las especificaciones funcionales y técnicas detalladas para el desarrollo del ecosistema de automatización digital de **Degusta y Disfruta C.A.** El objetivo es migrar progresivamente el control operativo tradicional en cuadernos físicos ("la vieja guardia") hacia una arquitectura híbrida basada en **Google Apps Script** y **AppSheet**. Este ecosistema optimizará el registro en planta, estandarizará las formulaciones de producción, controlará mermas e inventarios, automatizará la facturación/notas de entrega y facilitará la volcada masiva de datos hacia el sistema contable Fina.

## **2\. MÓDULO 1: REGISTRO MÓVIL DE COMPRAS Y COMPROBANTES DE EGRESO**

---

**Propósito:** Reemplazar los anotadores físicos por una captura digital directa desde dispositivos móviles al momento de efectuar compras de materia prima, repuestos o gastos de planta.

### **Requerimientos Funcionales Específicos:**

> * **Interfaz Formulario AppSheet:** Captura de Fecha, Proveedor, Categoría de Gasto (Materia Prima, Mantenimiento/Infraestructura, Servicios, Gastos Administrativos), Descripción detallada y Monto en USD y Bolívares (VES).  
> * **Captura y Digitalización de Comprobantes:** Carga obligatoria de fotografía de la factura física o nota de entrega mediante la cámara del smartphone. El Script debe guardar la imagen en Google Drive bajo el directorio /Comprobantes\_Egresos/YYYY-MM/ y renombrarla automáticamente (Ej: EGRESO\_20260804\_PROVEEDOR\_001.jpg).  
> * **Flujo de Aprobación Jerárquica:** Compras superiores a $100 USD activan una notificación automática vía correo electrónico o WhatsApp hacia la Gerencia (Julio Cedeño / Humberto Silva) para su validación antes de consolidar el egreso.  
> * **Exportador Homologado para Fina:** Función en Apps Script que transforma y formatea automáticamente los egresos registrados en una plantilla Google Sheets con la estructura exacta requerida para la importación masiva en el software contable Fina.

| Campo de Entrada | Tipo de Dato | Regla de Validación / Destino   |
| :---- | :---- | :---- |
| Monto Total USD / VES | Numérico Decimal | Conversión automática con tasa oficial BCB al día. |
| Foto Soporte | Archivo Imagen (JPG/PNG) | Obligatorio. Almacenamiento en Google Drive con enlace URL seguro. |
| Cuenta de Origen | Selección Única | Banca Amiga, Banesco, Banco de Venezuela, Efectivo Caja Chica, Cuenta Personal. |

## **3\. MÓDULO 2: GENERACIÓN DIGITAL DE VENTAS Y NOTAS DE ENTREGA**

---

**Propósito:** Digitalizar el proceso de atención y despacho comercial para clientes mayoristas (ej. Disprocar, Mercanoma, Urbe, clientes particulares) garantizando trazabilidad financiera y cobranza agilizada.

### **Requerimientos Funcionales Específicos:**

> * **Catálogo Móvil de Productos:** Selección rápida de cliente registrado o nuevo, tipo de producto (pan de hamburguesa junior, perro caliente granjero, sándwich, galleta de huevo, cachito, etc.) y cantidades por paquete o unidad.  
> * **Lógica de Tasa BCB en Tiempo Real:** Integración mediante Google Apps Script para obtener diariamente la cotización oficial del Banco Central de Venezuela (BCB) y calcular al instante montos en bolívares.  
> * **Generador Automático de Notas de Entrega PDF:** Script que toma los datos del pedido, rellena una plantilla institucional de Google Docs y genera un archivo PDF listo para su descarga o envío automatizado por WhatsApp / Gmail.  
> * **Módulo de Cuentas por Cobrar (Cruce Financiero):** Tablero que lista las notas de entrega emitidas pendientes de cobro. Permite al usuario "cruzar" el saldo abonado cuando se confirma la transferencia o pago en el banco.

## **4\. MÓDULO 3: CALCULADORA Y GENERADOR AUTOMÁTICO DE ÓRDENES DE PRODUCCIÓN**

---

**Propósito:** Reemplazar el cálculo manual en papel que realiza el Gerente de Producción (Humberto Silva) para emitir órdenes numéricas exactas (ej. Orden Nº 076\) que el panadero (Kevin) deba ejecutar sin margen de improvisación.

### **Requerimientos Funcionales Específicos:**

> * **Motor de Cálculo de Masa Total:** Ingreso de paquetes requeridos por tipo de pan. El sistema calcula automáticamente el pesaje total de masa requerida (en kg) aplicando los factores de porcionado (ej. pesada de 2,800 g para 36 panes junior).  
> * **Desglose Automatizado de Porcentajes de Panadero (Gramos Exactos):** Cálculo exacto en gramos de cada insumo necesario: Harina de trigo base, Azúcar, Manteca, Sal, Levadura y Esencias.  
> * **Generación e Impresión de Hoja de Producción Estandarizada:** Generación de un formato numerado listo para imprimir o visualización fija en planta que detalla: Número de orden correlativo, fecha, cliente de destino, gramos por ingrediente, instrucciones específicas y campos de firma de entrega/recepción.

## **5\. MÓDULO 4: CONTROL DE INVENTARIO DE MATERIA PRIMA Y REGISTRO DE MERMAS**

---

**Propósito:** Auditar las entradas de materia prima al almacén, detectar desviaciones físicas de peso al recibir sacos e incorporar consumos indirectos de mesa.

### **Requerimientos Funcionales Específicos:**

> * **Auditoría de Pesaje de Sacos (Alertas de Pérdida):** Registro del peso real verificado en balanza al recibir mercancía (ej. detección de sacos con 3.4 kg faltantes). Genera una alerta visual y un reporte de reclamación al proveedor si el déficit supera el límite tolerado.  
> * **Módulo de Asignación Fija para Harina de Mesa:** Formulario para registrar y auditar la asignación controlada de insumos no medibles por pieza, como el tobo de 4 kg de harina asignado cada 15 días para espolvorear la sobadora.  
> * **Reconciliación y Sincronización de Saldos:** Descuento automático de inventario al cerrarse una Orden de Producción y formateo de existencias consolidadas para importación en Fina.

## **6\. MÓDULO 5: MOTOR DE ESTRUCTURAS DE COSTOS, SUB-RECETAS Y PRECIOS DE VENTA**

---

**Propósito:** Adaptar la metodología de costeo desarrollada previamente para Serteca Consulting, permitiendo calcular el costo exacto de producción de los 23+ productos y determinar precios de venta rentables.

### **Requerimientos Funcionales Específicos:**

> * **Arquitectura Jerárquica Receta / Sub-receta:** Permite combinar el costo de la masa base con sub-recetas de rellenos (ej. mermelada de guayaba, queso, jamón ahumado y pasitas para pan de jamón).  
> * **Actualización Dinámica de Costos Directos e Indirectos:** Al cambiar el precio de compra de la harina o manteca en el Módulo 1, el script recalcula automáticamente el costo unitario de todos los productos del catálogo.  
> * **Simulador de Margen de Ganancia y Punto de Equilibrio:** Configuración de márgenes objetivo (35% a 40%, o hasta 57% según la categoría) incorporando retenciones, IVA y gastos operativos fijos.

## **7\. MÓDULO 6: SINCRONIZADOR DE INVENTARIO Y CATÁLOGO PARA MARKETING (APOYO A DOMI)**

---

**Propósito:** Conectar los datos operativos de producción y almacén con el área de marketing y redes sociales liderada por Sophie/Domi Urdaneta.

### **Requerimientos Funcionales Específicos:**

> * **Feed de Catálogo e Inventario Disponible:** Exportación continua de disponibilidad de stock y lista de precios vigentes hacia un catálogo digital dinámico accesible para ventas por Instagram o WhatsApp Business.  
> * **Asistente de Consulta Rápida:** Interfaz simple para que el equipo comercial responda instantáneamente solicitudes de clientes sobre disponibilidad y precios de productos terminados.

## **8\. MÓDULO 7: CONTROL E INVENTARIO DE CESTAS DE DESPACHO**

---

**Propósito:** Detener la pérdida de activos circulantes (cestas plásticas de despacho) manteniendo un rastreo preciso de entregas y retenciones por cliente.

### **Requerimientos Funcionales Específicos:**

> * **Registro de Entradas y Salidas por Ruta:** Control de cestas entregadas al transportista (Sr. Gallardo / Jorge) y recibidas de vuelta tras la entrega.  
> * **Histórico y Balance por Cliente:** Registro de saldo de cestas adeudadas por cliente (ej. seguimiento del caso crítico de las 298 cestas pendientes con alertas activas para recuperación o cobro mediante facturación).

## **9\. MÓDULO MASTER 8: PORTAL CENTRAL DE CONTROL ADMINISTRATIVO (DASHBOARD HUB CON OPERACIONES CRUD COMPLETAS)**

---

**Propósito:** Funcionar como la aplicación central integrada (Single Page Application web creada con Google Apps Script doGet()) que enlaza todos los módulos anteriores, ofreciendo un panel de control unificado con capacidades CRUD (Crear, Leer, Actualizar, Eliminar) completas sobre cualquier tabla del sistema.

### **Requerimientos Funcionales Específicos del Portal Master:**

> * **Menú de Navegación Modular Centralizado:** Barra lateral e interfaz tipo Dashboard que enlaza directamente con los 7 módulos funcionales, permitiendo saltar entre la gestión de compras, ventas, órdenes de producción, inventario, costos, catálogo de redes y cestas.  
> * **Motor Gestor CRUD Unificado (Create, Read, Update, Delete):**  
  * **Create (Crear):** Permite ingresar nuevos registros en cualquiera de los módulos desde una única interfaz web sin necesidad de acceder directamente a las hojas de Google Sheets subyacentes.  
  * **Read (Leer/Consultar):** Visualización de tablas dinámicas con filtros avanzados por fecha, cliente, proveedor, estado de orden o rango de montos.  
  * **Update (Actualizar/Editar):** Edición en tiempo real de registros existentes (ej. actualizar el estado de cobro de una nota de entrega, modificar un peso corregido en un saco de harina o editar una fórmula de producción).  
  * **Delete (Eliminar/Anular):** Anulación lógica o eliminación con auditoría de registros duplicados o erróneos, requiriendo confirmación administrativa.  
> * **Gestión de Usuarios y Roles de Seguridad:** Control de permisos granular para adaptar la interfaz según el rol del usuario:  
  * **Administrador / Gerencia (Julio, Diego, Humberto):** Acceso CRUD total a todos los módulos, ajustes del sistema y reportes ejecutivos.  
  * **Operador de Planta (Kevin / Producción):** Acceso restringido de lectura a Órdenes de Producción e ingreso de recetas.  
  * **Comercial y Marketing (Domi):** Acceso al módulo de catálogo, inventario disponible y lista de precios.  
> * **Panel Ejecutivo de KPIs Integrados:** Resumen en pantalla principal de métricas clave en tiempo real: Producción diaria en kg, Ventas del día ($ / VES), Cuentas por cobrar vencidas, Alertas de inventario bajo y Balance total de cestas en calle.

| Módulo Enlazado | Operaciones CRUD Permitidas | Nivel de Permiso Requerido   |
| :---- | :---- | :---- |
| 1\. Egresos y Compras | Crear egreso, Consultar lista, Editar monto/soporte, Anular egreso. | Administrador / Logística |
| 2\. Ventas y Notas de Entrega | Generar nota, Consultar pendientes, Cruzar pago, Eliminar duplicado. | Administrador / Ventas |
| 3\. Órdenes de Producción | Crear orden, Leer hoja de producción, Editar porcentajes, Anular orden. | Gerente de Producción / Admin |
| 4\. Inventario de Insumos | Registrar entrada/pesaje, Consultar stock, Ajustar mermas, Eliminar entrada. | Gerente de Producción / Admin |
| 5\. Estructuras de Costos | Crear receta/sub-receta, Consultar márgenes, Actualizar insumos, Anular receta. | Administrador / Dirección |
| 6\. Catálogo Marketing | Consultar stock, Actualizar precios públicos, Modificar ofertas. | Marketing (Domi) / Admin |
| 7\. Control de Cestas | Registrar salida/retorno, Leer balances por cliente, Modificar saldo. | Administrador / Logística |

## **10\. HOJA DE RUTA DE IMPLEMENTACIÓN Y RESPONSABLES**

---

Basado en los acuerdos operativos establecidos durante las reuniones de planificación:

> * **Capacitación Inicial en IA y Herramientas Digitales:** Julio Cedeño se reunirá con el asesor Ronnie para iniciar el diseño con Gemini y Apps Script.  
> * **Estructuración de Datos y Excel Base:** Julio Cedeño y Diego Cedeño organizarán las tablas iniciales de egresos y punto de equilibrio.  
> * **Pruebas Operativas en Planta:** Humberto Silva validará la interfaz de Órdenes de Producción e Inventario de Sacos durante las jornadas de trabajo.  
> * **Integración con Redes Sociales:** Sophie/Domi Urdaneta conectará los catálogos con la estrategia de difusión visual.