# Ecosistema Digital & ERP — Degusta y Disfruta C.A. (Maracaibo, Edo. Zulia)

Plataforma integral de gestión operativa, manufactura panadera, control logístico de cestas, costeo financiero multimoneda (**USD / VES BCB**) y automatización empresarial para **Degusta y Disfruta C.A.** (Maracaibo, Venezuela), desplegada sobre infraestructura propia (**HP ProDesk 600 G1 SFF** con Debian 13, Coolify, PostgreSQL 16, **Odoo 18.0 Community**, **n8n** y **Cloudflare Tunnels**).

---

## 🏗️ Arquitectura en Vivo (Self-Hosted)

| Componente | URL / Endpoint | Rol en el Ecosistema |
| :--- | :--- | :--- |
| **Odoo 18.0 Community** | `https://odoo.estilistasmvp.com` (DB: `DegustayDisfruta`) | Núcleo ERP: Contabilidad Analítica, Inventario (`stock`), Manufactura (`mrp`), Compras (`purchase`), Ventas (`sale_management`) y Tasa BCB (`res.currency.rate`). |
| **n8n Automation Server** | `https://n8n.estilistasmvp.com` | Orquestador de Tasa Oficial BCB, Bot de Telegram, Motor de Costeo Financiero + SEDEMAT y API Gateway CORS. |
| **API Gateway Webhook** | `https://n8n.estilistasmvp.com/webhook/degusta-erp-api` | Puente JSON-RPC en vivo entre Odoo 18, los Portales Web (`index.html`, `dashboard_supervisor.html`, `evaluacion_rrhh.html`) y Telegram. |
| **Bot de Telegram** | `@julio_cede_bot` (`ContadorUrbeBot`) | Alertas de mermas de harina ($>1\%$), deuda crítica de cestas ($\ge 50$), aprobaciones de gastos ($> \$100\text{ USD}$) y comandos en vivo (`/estado`, `/tasa`, `/produccion`, `/cestas`). |
| **Portales Web (Coolify)** | `/` (`index.html`), `/supervisor` (`dashboard_supervisor.html`), `/rrhh` (`evaluacion_rrhh.html`) | Interfaces ágiles para Planta (**Keivi** y **Humberto**), Dirección (**Julio** y **Diego Cedeño**) y Marketing (**Domi Urdaneta**). |

---

## 👥 Roles y Responsabilidades Operativas Configurados

1. **Julio Cedeño & Diego Cedeño (Dirección General, Finanzas y Despacho en Ruta)**:
   - Supervisión de flujo de caja en USD y Bolívares (Tasa Oficial BCB).
   - Aprobación obligatoria de egresos extraordinarios mayores a **$100.00 USD**.
   - Control de despacho en ruta principal (**Julio Cedeño**) y auditoría de las **450 Cestas Plásticas (`ACT-CESTA`)** (152 en planta / 298 en posesión de clientes en Maracaibo).
2. **Humberto Silva (Gerente de Producción e Inventario)**:
   - Recepción de materias primas con pesaje obligatorio por saco (sacos nominales de $45\text{ kg}$ con alerta automática a compras si la merma supera el $1\%$, ej. $< 44.55\text{ kg}$).
   - Asignación quincenal controlada de **1 tobo de $4.00\text{ kg}$ de Harina de Mesa / Espolvorear** imputado a Costos Indirectos de Planta (`CC-FIJOS`).
   - Evaluación de desempeño de personal de planta (`evaluacion_rrhh.html`).
3. **Keivi (Maestro Panadero)**:
   - Ejecución de Órdenes de Producción (`mrp.production`) con cálculo automático de **porcentajes de panadero en gramos exactos** (donde $\text{Harina de Trigo} = 100\%$).
4. **Sophie / Domi Urdaneta (Comercial, Marketing y Redes Sociales)**:
   - Consulta en tiempo real del Catálogo Comercial de los **23 productos** (18 de panificación propia + 5 de reventa como Tequeños Zulianos y Pastelitos) con disponibilidad de stock y precios actualizados en USD y VES (BCB).

---

## 💰 Separación Estricta: Valoración de Inventario vs. Costeo Financiero Real (Maracaibo)

En **Odoo 18 (`DegustayDisfruta`)** se configuró el Plan Analítico **`Estructura de Costos Degusta y Disfruta (Maracaibo)`** con 5 Centros de Costo para evitar distorsionar la valoración contable del inventario y a la vez garantizar que ningún costo quede por fuera del precio de venta:

1. **`CC-INV` — Costo Directo de Inventario (`standard_price`)**:
   - Solo incluye **Materia Prima Directa + Material de Empaque** según la Lista de Materiales (`mrp.bom`) de los 18 productos fabricados o el costo de factura de proveedor de los 5 productos de reventa.
2. **`CC-FIJOS` — Costos Fijos Operativos de Planta ($850.00 USD/mes)**:
   - Electricidad industrial (CORPOELEC / respaldo), gas/combustible de hornos, agua (HIDROLAGO), internet, depreciación de maquinaria, mantenimiento preventivo y el consumo quincenal del tobo de $4\text{ kg}$ de harina de mesa.
3. **`CC-MOD` — Mano de Obra Directa e Indirecta**:
   - Nómina de panadería (**Keivi** y ayudantes), gerencia de planta (**Humberto Silva**) y bonificaciones de producción.
4. **`CC-RUTA` — Logística, Despacho y Reposición de Cestas**:
   - Combustible y mantenimiento de unidad de reparto (**Julio Cedeño**) y reserva de reposición de cestas plásticas.
5. **`CC-SEDEMAT` — Impuestos Municipales Alcaldía de Maracaibo (2.0%) + Tributos SENIAT**:
   - **Alícuota Municipal SEDEMAT (2.0% sobre Ingresos Brutos)** por actividad industrial/comercial en el Municipio Maracaibo, más **Exento de IVA (0%)** para panificación básica o **IVA General (16% SENIAT)** según aplique.

---

## 🤖 Flujos Activos en n8n (`https://n8n.estilistasmvp.com`)

1. **`gddsR4PmYGYKQfj3`** — **Sincronizador Tasa Oficial BCB (Odoo 18 + Telegram)**:
   - Consulta diaria automática de la tasa oficial USD/VES del BCB, actualiza `res.currency.rate` en Odoo 18 y notifica la tasa vigente.
2. **`fjRV5sO2AuugDpvL`** — **Bot Telegram (`@julio_cede_bot`) Operaciones, Planta y Alertas**:
   - Atiende comandos interactivos y recibe alertas de mermas de harina, cestas retenidas y aprobaciones $> \$100\text{ USD}$.
3. **`I1b440S7lqlEYYgn`** — **Motor de Costeo Financiero + Alícuota SEDEMAT (Maracaibo)**:
   - Recalcula periódicamente el precio sugerido en Odoo (`list_price`) absorbiendo `standard_price` + carga fija de planta + SEDEMAT 2.0% + margen objetivo.
4. **`TK1U3wubjODMnnyU`** — **API Gateway Portal Web & Telegram Bot (`@julio_cede_bot`)**:
   - Endpoint Webhook `POST https://n8n.estilistasmvp.com/webhook/degusta-erp-api` con cabeceras CORS habilitadas para sincronizar el Portal Web con Odoo 18 en tiempo real.

---

## 🚀 Despliegue en Coolify

Este repositorio incluye `Dockerfile` (basado en `nginx:alpine`) y `nginx.conf` optimizado para servir las tres aplicaciones web en un único contenedor ligero:
- `/` $\rightarrow$ `index.html` (ERP Principal & Calculadora de Panadería)
- `/supervisor` $\rightarrow$ `dashboard_supervisor.html` (Torre de Control Gerencial, Costeo SEDEMAT y Cestas)
- `/rrhh` $\rightarrow$ `evaluacion_rrhh.html` (Sistema de Evaluación de Desempeño de Planta)
- `/health` $\rightarrow$ Endpoint HTTP `200 OK` para el Healthcheck de Coolify / Cloudflare Tunnel.
