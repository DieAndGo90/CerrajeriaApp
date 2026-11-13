# 🔐 CerrajeriaApp

Sistema web de gestión de inventario para una cerrajería, desarrollado como proyecto full stack con **Java, Spring Boot, React y MySQL**.

El objetivo es construir una aplicación funcional que permita administrar productos, controlar existencias, registrar movimientos de stock y consultar costos, precios y rentabilidad estimada, aplicando buenas prácticas de desarrollo de software.

Actualmente, CerrajeriaApp incluye un Dashboard de gestión con indicadores de inventario, valorización de mercadería, estadísticas históricas, filtros por período, alertas de productos agotados y reportes exportables.

## 🛠️ Tecnologías

### Backend

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Maven
- Lombok
- Bean Validation

### Frontend

- React
- Vite
- JavaScript
- Fetch API
- CSS

### Base de datos

- MySQL

## ✅ Funcionalidades implementadas

### Dashboard de gestión

- Panel principal con indicadores generales del inventario.
- Cantidad de productos registrados y unidades disponibles.
- Identificación de productos sin stock.
- Valorización del inventario a costo de compra.
- Indicador de cobertura de costos registrados.
- Cálculo del valor potencial de venta del inventario.
- Estadísticas acumuladas de entradas y salidas de stock.
- Gráficos comparativos de movimientos por mes.
- Tabla de balances mensuales con indicadores visuales.
- Ranking de hasta cinco productos con mayor movimiento de stock, según la suma de unidades ingresadas y retiradas.
- Panel de alertas de productos agotados.
- Filtros dinámicos por mes o por todo el historial, aplicados a estadísticas, gráficos, balances y ranking de movimientos.
- Exportación del resumen mensual del período seleccionado a CSV compatible con Excel.
- Actualización manual de datos sin recargar la aplicación.
- Manejo de estados de carga, errores y ausencia de movimientos.
- Diseño responsive integrado con la navegación lateral.

Los indicadores de inventario representan el estado actual de las existencias, independientemente del período seleccionado para las estadísticas de movimientos.

El valor del inventario a costo se obtiene multiplicando el stock por el costo de compra registrado de cada producto. Si faltan costos, el resultado es parcial y se informa el porcentaje de productos con costo registrado.

El valor potencial de venta se obtiene multiplicando el stock por el precio de venta de cada producto. No representa facturación ni ganancias realizadas.

### Gestión de productos

- Crear y listar productos.
- Buscar productos por ID mediante la API REST.
- Buscar productos por nombre desde React.
- Editar nombre, precio de venta y costo de compra.
- Eliminar productos sin movimientos asociados.
- Confirmación antes de eliminar.
- Indicadores visuales de productos sin stock.
- Contador de productos registrados.
- Validaciones y mensajes de éxito o error.

### Gestión de movimientos de stock

- Registrar entradas y salidas de productos.
- Actualizar automáticamente el stock disponible.
- Registrar observaciones opcionales.
- Consultar el historial de movimientos.
- Mostrar fecha, producto, tipo, cantidad y observación.
- Ordenar el historial por fecha, mostrando los movimientos recientes primero.
- Filtrar movimientos por tipo: entrada o salida.
- Buscar movimientos por nombre de producto.
- Combinar filtros de búsqueda y tipo.
- Actualizar automáticamente el historial después de registrar un movimiento.
- Identificar entradas y salidas mediante etiquetas visuales.

### Costos, precios y rentabilidad

- Registrar el costo de compra de cada producto.
- Establecer y modificar el precio de venta.
- Actualizar el costo de compra de productos existentes.
- Calcular automáticamente la ganancia bruta por unidad.
- Calcular el margen bruto porcentual sobre el precio de venta.
- Mostrar costos, ganancias y márgenes en el inventario de React.
- Diferenciar productos sin costo registrado de productos con costo igual a cero.
- Mostrar "Sin registrar" y "Sin calcular" cuando corresponda.
- Validar que los costos de compra no sean negativos.
- Mantener la compatibilidad con productos existentes sin costo registrado.

Los cálculos de rentabilidad se realizan en el backend mediante `BigDecimal`.

**Ganancia bruta por unidad:**

`gananciaBruta = precio - costoCompra`

**Margen bruto porcentual:**

`margenPorcentaje = (gananciaBruta / precio) * 100`

La ganancia bruta y el margen son valores calculados que se devuelven mediante `ProductoDTO`, sin almacenarse como columnas adicionales en MySQL.

Estos indicadores representan una rentabilidad estimada por unidad, antes de impuestos y otros gastos. No representan ganancias efectivamente realizadas mediante ventas.

### Reglas de negocio

- Las cantidades de los movimientos deben ser mayores que cero.
- No se permiten salidas superiores al stock disponible.
- El stock no puede quedar negativo mediante los movimientos.
- Los cambios de stock de productos existentes se realizan mediante movimientos registrados.
- La edición de productos permite modificar nombre, precio y costo, pero no directamente el stock.
- Los productos con movimientos registrados no pueden eliminarse.
- Los productos nuevos con stock inicial positivo generan automáticamente un movimiento de entrada con la observación "Stock inicial".
- La creación del producto y el registro de su stock inicial se realizan dentro de una misma transacción.
- El precio de venta debe ser mayor que cero.
- El costo de compra no puede ser negativo.
- El costo de compra puede permanecer sin registrar temporalmente.
- Si un producto no tiene costo registrado, no se calcula su ganancia ni su margen.
- Los cálculos de ganancia bruta y margen por producto se realizan en el backend; React calcula los indicadores agregados del Dashboard a partir de los datos recibidos de la API.

### Interfaz y experiencia de usuario

- Navegación lateral entre Dashboard, Productos y Movimientos de Stock, con el Dashboard como pantalla inicial.
- Interfaz responsive para escritorio y dispositivos móviles.
- Formularios con validaciones.
- Estados de carga y mensajes de error.
- Tablas de inventario e historial.
- Tabla de productos con precio, costo de compra, ganancia bruta y margen porcentual.
- Desplazamiento horizontal de tablas en pantallas pequeñas.
- Confirmación personalizada de eliminación.
- Mensajes de éxito al registrar operaciones.
- Comunicación con la API REST de Spring Boot.

## 📦 Modelo de datos

### Producto

Cada producto contiene los siguientes atributos persistidos:

- `id`
- `nombre`
- `stock`
- `precio`
- `costoCompra`

El atributo `precio` representa el precio de venta.

Los campos `gananciaBruta` y `margenPorcentaje` forman parte de `ProductoDTO` y se calculan automáticamente a partir del precio y el costo de compra.

### MovimientoStock

Cada movimiento contiene:

- `id`
- `producto`
- `tipo` (`ENTRADA` o `SALIDA`)
- `cantidad`
- `observacion`
- `fecha`

Un producto puede tener múltiples movimientos asociados mediante una relación `ManyToOne` desde `MovimientoStock` hacia `Producto`.

## 🏗️ Arquitectura

El backend utiliza una arquitectura por capas:

**Controller → Service → Repository → MySQL**

- **Controller:** expone los endpoints REST y recibe solicitudes HTTP.
- **Service:** implementa las reglas de negocio, las operaciones de stock y los cálculos de rentabilidad.
- **Repository:** gestiona el acceso a MySQL mediante Spring Data JPA.
- **Entity:** representa los datos persistidos.
- **DTO:** permite intercambiar datos entre el backend y el frontend.

Se utilizan:

- `ProductoDTO`
- `MovimientoStockDTO`
- `MovimientoStockResponseDTO`

El manejo global de excepciones se implementa mediante `GlobalExceptionHandler`.

El frontend está organizado en componentes y páginas React, separando la navegación y las páginas de Dashboard, Productos y Movimientos de Stock.

El Dashboard reutiliza los endpoints `GET /productos` y `GET /movimientos` para calcular indicadores, agrupar movimientos por mes, filtrar estadísticas y generar reportes CSV desde React. No requiere endpoints adicionales.

## 🌐 Endpoints de la API REST

### Productos

| Método | Endpoint                       | Descripción                                                   |
| ------ | ------------------------------ | ------------------------------------------------------------- |
| POST   | `/productos`                   | Crear producto con precio de venta y costo de compra opcional |
| GET    | `/productos`                   | Listar productos con información comercial                    |
| GET    | `/productos/{id}`              | Buscar producto por ID                                        |
| GET    | `/productos/buscar?nombre=...` | Buscar productos por nombre                                   |
| PUT    | `/productos/{id}`              | Editar nombre, precio y costo de compra                       |
| DELETE | `/productos/{id}`              | Eliminar producto sin movimientos asociados                   |

Las respuestas de productos incluyen la ganancia bruta y el margen porcentual calculados cuando existe información suficiente.

### Movimientos de stock

| Método | Endpoint                             | Descripción                          |
| ------ | ------------------------------------ | ------------------------------------ |
| POST   | `/movimientos`                       | Registrar entrada o salida           |
| GET    | `/movimientos`                       | Listar movimientos                   |
| GET    | `/movimientos/producto/{productoId}` | Consultar movimientos de un producto |

## 📡 Respuestas HTTP

La API utiliza códigos HTTP para comunicar el resultado de las operaciones.

- `200 OK`: consulta o actualización exitosa.
- `201 Created`: recurso creado correctamente.
- `204 No Content`: eliminación exitosa.
- `400 Bad Request`: datos inválidos, stock insuficiente u operación no permitida.
- `404 Not Found`: recurso inexistente.

Los errores se procesan mediante un manejador global de excepciones y se devuelven al frontend para mostrar mensajes informativos.

## 🗄️ Base de datos

La aplicación utiliza MySQL.

**Base de datos de desarrollo:** `cerrajeria_db`

Tablas principales:

- `productos`
- `movimientos_stock`

La tabla `productos` almacena los datos principales de cada producto, incluyendo su precio de venta y costo de compra.

Los campos de ganancia bruta y margen porcentual no se almacenan en MySQL, ya que se calculan dinámicamente en el backend.

La tabla `movimientos_stock` contiene una clave foránea `producto_id` que relaciona cada movimiento con su producto.

Los cambios de stock se ejecutan mediante operaciones transaccionales para mantener la consistencia de los datos.

## 🧪 Pruebas realizadas

El proyecto fue probado durante su desarrollo mediante Postman, el navegador web y consultas a MySQL con phpMyAdmin.

Se verificaron:

- Operaciones CRUD de productos.
- Búsquedas y validaciones.
- Registro de entradas y salidas.
- Actualización de stock.
- Rechazo de salidas con stock insuficiente.
- Persistencia del historial en MySQL.
- Registro automático de stock inicial.
- Protección contra eliminación de productos con historial.
- Eliminación de productos sin movimientos asociados.
- Comunicación entre React y Spring Boot.
- Visualización y filtrado del historial.
- Incorporación de `costoCompra` sin perder productos existentes.
- Creación, consulta y edición de productos con costo de compra.
- Cálculo automático de ganancia bruta y margen porcentual.
- Validación y rechazo de costos negativos mediante HTTP 400.
- Creación de productos sin costo registrado.
- Persistencia de precios y costos en MySQL.
- Visualización de rentabilidad en React.
- Comprobación del diseño responsive en dispositivos móviles.

### Dashboard de gestión

- Cálculo de indicadores de inventario y actualización del stock tras registrar movimientos.
- Valorización a costo registrado, cobertura de costos y valor potencial de venta.
- Agrupación de entradas y salidas por mes y cálculo de balances.
- Incorporación automática de un nuevo mes al registrar un movimiento.
- Ranking de productos y alertas de productos sin stock.
- Filtrado de estadísticas, gráficos, tabla y ranking por período.
- Visualización de mensajes de error al detener el backend y recuperación de datos mediante el botón de actualización.
- Descarga del resumen mensual en CSV y apertura correcta en Excel.

El backend también fue compilado y empaquetado correctamente mediante Maven durante las etapas anteriores.

## 📌 Estado actual

**Backend MVP:** finalizado y ampliado con gestión de movimientos de stock, costos, precios y cálculos de rentabilidad.

**Frontend React:** integrado con la API REST, con gestión de productos, registro e historial de movimientos, visualización de información comercial y Dashboard de gestión.

**Base de datos MySQL:** integrada y operativa en el entorno de desarrollo.

**Etapa 09 — Dashboard de gestión:** completada.

El proyecto cuenta con una versión funcional de gestión de inventario, control de movimientos, consulta de rentabilidad estimada por producto y análisis de indicadores del negocio. La aplicación funciona en el entorno local de desarrollo; el despliegue en producción queda pendiente.

## 🚀 Próximas funcionalidades

**Próxima etapa: 10 — Actualización masiva de precios.**

Se prevé incorporar la actualización porcentual de precios de venta, con vista previa, confirmación y persistencia en el backend, sin modificar el stock ni los costos de compra automáticamente.

Otras mejoras previstas para futuras etapas:

- Alertas de stock mínimo.
- Registro de ventas e ingresos.
- Gestión de proveedores.
- Importación y actualización de listas de precios de proveedores.
- Historial de cambios de costos y precios.
- Mejoras adicionales de experiencia de usuario.
- Autenticación y control de acceso mediante usuarios y roles.
- Preparación y despliegue de la aplicación.

Estas funcionalidades todavía no forman parte de la versión actual.

## 🎯 Objetivo del proyecto

CerrajeriaApp es un proyecto de portfolio orientado a aplicar conocimientos de desarrollo full stack, arquitectura por capas, APIs REST, persistencia de datos y reglas de negocio.

La aplicación busca evolucionar progresivamente hacia un sistema de gestión sencillo, confiable y utilizable en una cerrajería real.
