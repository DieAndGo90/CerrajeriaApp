# 🔐 CerrajeriaApp

Sistema web de gestión de inventario para una cerrajería, desarrollado como proyecto full stack con **Java, Spring Boot, React y MySQL**.

El objetivo es construir una aplicación funcional que permita administrar productos, controlar existencias, registrar movimientos de stock y consultar costos, precios y rentabilidad estimada, aplicando buenas prácticas de desarrollo de software.

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
- Los cálculos comerciales se realizan en el backend, evitando duplicar reglas de negocio en React.

### Interfaz y experiencia de usuario

- Navegación lateral entre Productos y Movimientos de Stock.
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

El frontend está organizado en componentes y páginas React, separando la navegación y la gestión de productos y movimientos.

## 🌐 Endpoints de la API REST

### Productos

| Método | Endpoint                       | Descripción                                 |
| ------ | ------------------------------ | ------------------------------------------- |
| POST   | `/productos`                   | Crear producto con precio y costo opcional  |
| GET    | `/productos`                   | Listar productos con información comercial  |
| GET    | `/productos/{id}`              | Buscar producto por ID                      |
| GET    | `/productos/buscar?nombre=...` | Buscar productos por nombre                 |
| PUT    | `/productos/{id}`              | Editar nombre, precio y costo de compra     |
| DELETE | `/productos/{id}`              | Eliminar producto sin movimientos asociados |

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

El backend también fue compilado y empaquetado correctamente mediante Maven durante las etapas anteriores.

## 📌 Estado actual

**Backend MVP:** finalizado y ampliado con gestión de movimientos de stock, costos, precios y cálculos de rentabilidad.

**Frontend React:** integrado con la API REST, con gestión de productos, registro e historial de movimientos, y visualización de información comercial.

**Base de datos MySQL:** integrada y operativa en el entorno de desarrollo.

El proyecto cuenta con una versión funcional de gestión de inventario y consulta de rentabilidad estimada por producto.

## 🚀 Próximas funcionalidades

Las siguientes mejoras se consideran para futuras etapas:

- Alertas de stock mínimo.
- Registro de ventas e ingresos.
- Dashboard con indicadores del negocio.
- Gestión de proveedores.
- Importación y actualización de listas de precios de proveedores.
- Historial de cambios de costos y precios.
- Mejoras adicionales de experiencia de usuario.
- Preparación y despliegue de la aplicación.

Estas funcionalidades todavía no forman parte de la versión actual.

## 🎯 Objetivo del proyecto

CerrajeriaApp es un proyecto de portfolio orientado a aplicar conocimientos de desarrollo full stack, arquitectura por capas, APIs REST, persistencia de datos y reglas de negocio.

La aplicación busca evolucionar progresivamente hacia un sistema de gestión sencillo, confiable y utilizable en una cerrajería real.
