# Registro de Decisiones de Diseño y Arquitectura

Este documento detalla las decisiones técnicas y de diseño tomadas durante el desarrollo del Ecosistema Digital para **Degusta y Disfruta C.A.**

---

## 1. Arquitectura de Base de Datos Híbrida (Google Sheets)
* **Decisión:** Utilizar un único archivo de Google Sheets como motor de base de datos relacional simplificado, donde cada módulo operativo corresponde a una pestaña (`Egresos`, `Ventas`, `Clientes`, `Productos`, `Recetas`, `OrdenesProduccion`, `Inventario`, `Cestas`).
* **Justificación:** Mantiene los datos legibles y accesibles directamente por la directiva (Julio y Diego Cedeño) mediante Sheets tradicionales, al tiempo que permite al script de backend leer y escribir de forma estructurada a través de una API CRUD genérica (`Database.gs`).
* **Manejo de IDs:** Se asignan UUIDs únicos generados mediante `Utilities.getUuid()` para garantizar que los registros no se sobreescriban ni se dupliquen al cruzar datos.

---

## 2. Desarrollo del Portal como Single Page Application (SPA)
* **Decisión:** Implementar toda la interfaz gráfica de usuario en un único archivo `index.html` servido a través de `doGet(e)` con `HtmlService`.
* **Justificación:** Apps Script impone límites en la carga de archivos externos y latencias altas en redirecciones de páginas. Una SPA con una barra lateral de navegación que oculta/muestra secciones dinámicamente es la forma más rápida y fluida de brindar una experiencia de usuario de tipo "Aplicación de Escritorio".
* **Diseño Estético:** Se optó por una paleta de colores moderna de grises oscuros y acentos ámbar (inspirados en el pan horneado), tipografía limpia (Outfit) e iconos interactivos (FontAwesome), rompiendo con el diseño gris básico de los formularios tradicionales.

---

## 3. Algoritmo de Porcentajes de Panadero en Producción
* **Decisión:** Resolver los ingredientes mediante la fórmula tradicional de panadería (donde la Harina es siempre el 100% de la base y el resto de los ingredientes se calculan como una fracción de la harina).
* **Fórmula Matemática:**
  $$\text{Harina} = \frac{\text{Masa Total Requerida}}{1 + \sum (\text{Porcentaje de otros ingredientes} / 100)}$$
  $$\text{Ingrediente}_i = \text{Harina} \times (\text{Porcentaje}_i / 100)$$
* **Justificación:** Es el método exacto y estandarizado con el que operan los panaderos industriales en planta (como Kevin), eliminando errores de cálculo manual.

---

## 4. Tipo de Cambio BCB en Tiempo Real con Doble Fallback
* **Decisión:** Para calcular montos al instante en Bolívares (VES), el script intenta primero consultar la API pública `ve.dolarapi.com` (especializada en tasas venezolanas). Si falla por red o timeout, realiza un scraping directo por regex en la web del BCB (`https://www.bcb.org.ve/`). Si ambos fallan, busca el último tipo de cambio guardado en la hoja de `Ventas` o recurre a una tasa fija de contingencia.
* **Justificación:** En Venezuela la tasa de cambio fluctúa diariamente. Este enfoque híbrido garantiza que la facturación nunca se detenga debido a problemas de conexión con el banco central.

---

## 5. Control de Auditoría Física y Alertas
* **Decisión:**
  * **Egresos:** Cualquier gasto superior a $100 USD se guarda en estado "Pendiente" y despacha un correo de aprobación automatizado a la gerencia.
  * **Mermas de Almacén:** Al registrar un saco recibido, si la balanza física de planta registra una pérdida superior al 1% del peso nominal esperado del saco, el sistema activa una alerta visual de pérdida y envía un correo a la dirección.
  * **Cestas:** Si un cliente acumula un saldo deudor mayor o igual a 50 cestas plásticas, se genera una notificación de cobro o plan de recolección en ruta.
* **Justificación:** Estos disparadores automatizan la fiscalización de activos e insumos sin requerir que la directiva audite las hojas manualmente todos los días.
