# 🔐 CerrajeriaApp

Sistema web de gestión de inventario para una cerrajería, desarrollado como proyecto full stack con **Java, Spring Boot, React y MySQL**.

El objetivo es construir una aplicación funcional que permita administrar productos, controlar existencias, registrar movimientos de stock y consultar costos, precios y rentabilidad estimada, aplicando buenas prácticas de desarrollo de software.

Actualmente, CerrajeriaApp incluye un Panel de control administrativo con indicadores de inventario, valorización de mercadería, estadísticas históricas, filtros por período y alertas de productos agotados y con stock bajo. Permite gestionar productos y movimientos de stock, actualizar masivamente los precios de venta y generar reportes Excel. También cuenta con **autenticación mediante Spring Security y permisos diferenciados para ADMIN y EMPLEADO**: el empleado puede operar con productos, precios de venta y movimientos sin acceder a costos, márgenes ni rentabilidad. La auditoría registra las acciones de ambos roles y permite al administrador consultar y exportar el historial reciente.

## 🛠️ Tecnologías

### Backend

- Java 17
- Spring Boot
- Spring Web
- Spring Security (autenticación, sesiones y protección CSRF)
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
- ExcelJS

### Base de datos

- MySQL

## ✅ Funcionalidades implementadas

### Seguridad y autenticación de usuarios

- Usuarios `ADMIN` y `EMPLEADO` persistidos en MySQL, con contraseñas almacenadas mediante hash BCrypt.
- Creación del administrador inicial al arrancar el backend si todavía no existe y se configuró `CERRAJERIA_ADMIN_PASSWORD`.
- Usuario empleado configurado con contraseña inicial mediante la variable de entorno `CERRAJERIA_EMPLEADO_PASSWORD`.
- Login desde React con nombre de usuario y contraseña, validado por Spring Security contra MySQL.
- Autenticación mediante sesión HTTP y cookie `JSESSIONID` (sin JWT).
- Protección CSRF activa para solicitudes que modifican datos, incluyendo login y logout.
- Configuración CORS para el frontend de desarrollo, con envío de credenciales.
- Verificación de sesión al cargar React y botón de cierre de sesión que invalida la sesión del servidor.
- Cliente reutilizable `frontend/src/apiFetch.js` para enviar cookies y tokens CSRF al backend.
- Autorización real de endpoints desde `SecurityConfig.java`, además de interfaces React diferenciadas según el rol.

**Permisos por rol:**

| Funcionalidad                                                    | ADMIN | EMPLEADO |
| ---------------------------------------------------------------- | :---: | :------: |
| Consultar productos, stock y precios de venta                    |  ✅   |    ✅    |
| Crear y editar productos; eliminar solo si no tienen movimientos |  ✅   |    ✅    |
| Registrar y consultar movimientos de stock                       |  ✅   |    ✅    |
| Exportar inventario (detalle según rol)                          |  ✅   |    ✅    |
| Consultar costos, ganancias y márgenes                           |  ✅   |    ❌    |
| Acceder al Panel de control económico                            |  ✅   |    ❌    |
| Actualizar masivamente los precios                               |  ✅   |    ❌    |
| Acceder a los endpoints administrativos de productos             |  ✅   |    ❌    |
| Consultar, filtrar y exportar la auditoría                       |  ✅   |    ❌    |

El administrador utiliza la interfaz completa de CerrajeriaApp. El empleado utiliza un panel con **Inventario**, **Movimientos de Stock** y **Alertas de inventario**, que muestra solamente los datos necesarios para operar.

La API operativa (`/operativo/productos`) emplea DTO específicos para permitir el CRUD sin exponer ni permitir la asignación de `costoCompra`. Los endpoints administrativos (`/productos`, excepto las consultas de stock autorizadas) permanecen restringidos al administrador. Esta protección se aplica en Spring Boot: ocultar campos en React no es la única medida de seguridad.

### Auditoría de acciones por usuario

- Registro automático de inicios y cierres de sesión, creación, edición y eliminación de productos, activación y desactivación, entradas y salidas de stock, cambios de stock mínimo y actualización masiva de precios.
- Identificación del usuario mediante Spring Security, sin confiar en un nombre enviado por React.
- Persistencia de usuario, acción, fecha, ID de producto cuando corresponde y detalle en MySQL.
- Operaciones de negocio y sus registros de auditoría dentro de la misma transacción; los cambios fallidos no deben dejar registros de éxito.
- Conservación de registros después de eliminar un producto; el ID se conserva como referencia histórica.
- Acceso de solo lectura desde la aplicación, exclusivo de ADMIN, protegido en el backend.
- Interfaz con filtros por usuario, acción, fechas y búsqueda por ID o detalle; validación del rango de fechas.
- Consulta de hasta los últimos 100 registros, ordenados del más reciente al más antiguo. Los filtros y exportaciones se limitan a los datos cargados; no eliminan los registros antiguos de MySQL.
- Exportación a Excel del historial cargado o de los resultados filtrados.
- No se registran contraseñas ni tokens de sesión en la auditoría.

### Actualización masiva de precios

- Actualización porcentual de los precios de venta de todo el inventario.
- Vista previa de los nuevos precios y diferencias antes de aplicar los cambios.
- Confirmación previa a la actualización masiva.
- Validación de porcentajes positivos.
- Actualización transaccional de precios mediante Spring Boot y JPA.
- Conservación de los costos de compra y las existencias.
- Recálculo automático de la ganancia bruta y el margen de rentabilidad.
- Actualización automática del listado de productos después de confirmar la operación.

### Panel de control

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
- Panel de alertas de productos activos agotados o con stock bajo.
- Filtros dinámicos por mes o por todo el historial, aplicados a estadísticas, gráficos, balances y ranking de movimientos.
- Exportación a Excel (.xlsx) del resumen mensual y del detalle de movimientos correspondientes al período seleccionado.
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
- Editar nombre y precio de venta; el costo de compra queda reservado al administrador.
- Eliminar productos sin movimientos asociados.
- Confirmación antes de eliminar.
- Indicadores visuales de productos sin stock.
- Contador de productos registrados.
- Validaciones y mensajes de éxito o error.
- Exportación del inventario completo a Excel, independientemente de la búsqueda activa, con información económica exclusiva de ADMIN.
- Gestión operativa de productos por EMPLEADO mediante una interfaz con ID, nombre, stock y precio de venta, búsqueda y acciones CRUD.

### Activación y desactivación de productos

- Activación y desactivación de productos por ADMIN y EMPLEADO.
- Persistencia del estado activo/inactivo en MySQL.
- Creación de productos activos por defecto.
- Conservación del stock, precios e historial al desactivar.
- Filtros por estado combinados con búsqueda por nombre.
- Indicadores visuales de productos activos e inactivos.
- Confirmación antes de desactivar un producto.
- Bloqueo de entradas y salidas de productos inactivos desde el backend.
- Selector de movimientos limitado a productos activos.
- Conservación del historial de productos inactivos.
- Indicadores de productos activos e inactivos en el Panel de control.
- Exclusión de productos inactivos de las alertas de reposición.
- Inclusión del estado del producto en los reportes Excel.
- Endpoints administrativos y operativos separados para proteger costos y rentabilidad.

**Endpoints administrativos — ADMIN:**

| Método | Endpoint                     | Descripción         |
| ------ | ---------------------------- | ------------------- |
| PATCH  | `/productos/{id}/activar`    | Activar producto    |
| PATCH  | `/productos/{id}/desactivar` | Desactivar producto |
| GET    | `/productos?activo=true`     | Listar activos      |
| GET    | `/productos?activo=false`    | Listar inactivos    |

**Endpoints operativos — ADMIN y EMPLEADO:**

| Método | Endpoint                               | Descripción         |
| ------ | -------------------------------------- | ------------------- |
| PATCH  | `/operativo/productos/{id}/activar`    | Activar producto    |
| PATCH  | `/operativo/productos/{id}/desactivar` | Desactivar producto |

Las operaciones PATCH requieren una sesión autenticada y un token CSRF válido.

### Stock mínimo y alertas de inventario

- Stock mínimo individual configurable por ADMIN y EMPLEADO al crear o editar productos.
- Valor predeterminado de 0 y validación de valores no negativos.
- Stock normal: superior al mínimo. Stock bajo: mayor que cero e igual o inferior al mínimo. Sin stock: cero unidades.
- Los productos inactivos se excluyen de las alertas de reposición.
- Alertas calculadas a partir del stock actual, sin una tabla adicional; se recalculan al consultar después de un movimiento.
- Filtros de stock combinables con el estado del producto y la búsqueda por nombre.
- Panel de control administrativo con indicadores de stock bajo y agotados; pestaña de alertas para EMPLEADO.
- Endpoint compartido: `GET /operativo/productos/alertas-stock` (sin costos ni rentabilidad).
- Reportes de inventario de ambos roles con stock mínimo y estado de stock.

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
- Exportar el historial a Excel respetando los filtros de tipo y nombre de producto.

### Costos, precios y rentabilidad

- Registrar el costo de compra de cada producto.
- Establecer y modificar el precio de venta.
- Actualizar el costo de compra de productos existentes.
- Calcular automáticamente la ganancia bruta por unidad.
- Calcular el margen bruto porcentual sobre el precio de venta.
- Mostrar costos, ganancias y márgenes únicamente en el inventario del administrador.
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

### Reportes y exportación a Excel

Los reportes se generan desde React mediante ExcelJS y se descargan como archivos `.xlsx`, utilizando los datos de la API REST existente. No requieren endpoints adicionales ni cambios en el modelo de datos.

**Reporte del Panel de control:**

- Hoja `Resumen mensual`: mes, unidades ingresadas, unidades retiradas, balance y fila de totales.
- Hoja `Detalle movimientos`: fecha y hora, ID del producto, nombre, tipo, cantidad y observación.
- Ambas hojas respetan el período seleccionado en el Panel de control (un mes o todo el historial).

**Reporte de inventario:**

- Hoja `Inventario`: ID, producto, stock, stock mínimo, estado del stock, costo unitario, precio de venta, ganancia bruta por unidad, margen bruto, costo total del stock, venta potencial, ganancia potencial y estado del costo.
- Hoja `Resumen económico`: fecha de generación, productos registrados, unidades disponibles, productos agotados, cobertura de costos, valorización a costo registrado, venta potencial, ganancia bruta potencial y margen bruto potencial.
- El inventario operativo del empleado incluye stock mínimo y estado de reposición, sin costos ni márgenes.
- El resumen económico incluye recuentos de productos activos agotados, con stock bajo y alertas totales.
- Consulta el inventario completo mediante `GET /productos`, sin depender de los resultados de la búsqueda en pantalla.
- Diferencia los costos no registrados de los costos iguales a cero.

**Reporte del historial de movimientos:**

- Hoja `Historial de movimientos`: ID del movimiento, fecha y hora, ID del producto, nombre, tipo, cantidad y observación, ordenados del más reciente al más antiguo.
- Hoja `Resumen del historial`: fecha de generación, filtros aplicados, cantidad de movimientos y productos involucrados, cantidad de registros de entrada y salida, unidades ingresadas y retiradas, y balance de unidades.
- Respeta la combinación de filtros por tipo de movimiento y nombre de producto.

**Reporte de auditoría — solo ADMIN:**

- Hoja `Auditoría`: ID del registro, fecha y hora, usuario, acción, ID del producto y detalle.
- Hoja `Información del reporte`: fecha de generación, alcance, cantidad de registros y filtros aplicados.
- Exportación de todos los registros cargados o solo de los resultados filtrados, hasta el límite actual de 100 registros recientes.

**Características comunes:**

- Archivos Excel con múltiples hojas, encabezados con estilos, columnas ajustadas, filtros y encabezados congelados.
- Formatos numéricos, monetarios, porcentuales y de fecha según el tipo de información.
- Estados de exportación y mensajes de error durante la generación del archivo.
- Utilidad reutilizable `frontend/src/utils/excel.js` para crear libros, agregar hojas y descargar los reportes.

### Reglas de negocio

- Las cantidades de los movimientos deben ser mayores que cero.
- No se permiten salidas superiores al stock disponible.
- El stock no puede quedar negativo mediante los movimientos.
- Los cambios de stock de productos existentes se realizan mediante movimientos registrados.
- ADMIN puede editar nombre, precio, stock mínimo y costo; EMPLEADO puede editar nombre, precio de venta y stock mínimo, pero no el costo. Ninguno modifica el stock directamente durante la edición.
- Los productos con movimientos registrados no pueden eliminarse, independientemente del rol.
- Los productos nuevos con stock inicial positivo generan automáticamente un movimiento de entrada con la observación "Stock inicial".
- La creación del producto y el registro de su stock inicial se realizan dentro de una misma transacción.
- El precio de venta debe ser mayor que cero.
- El costo de compra no puede ser negativo.
- El costo de compra puede permanecer sin registrar temporalmente.
- Si un producto no tiene costo registrado, no se calcula su ganancia ni su margen.
- Los cálculos de ganancia bruta y margen por producto se realizan en el backend; React calcula los indicadores agregados del Panel de control y los reportes a partir de los datos recibidos de la API.
- La ganancia potencial del inventario se calcula únicamente para los productos con costo registrado. El margen bruto potencial se obtiene dividiendo esa ganancia por el valor potencial de venta del mismo conjunto de productos.
- El balance de movimientos (entradas menos salidas) representa la variación de unidades en la selección, no necesariamente el stock actual.
- Los reportes económicos representan valores potenciales a los precios actuales, no ventas ni ganancias efectivamente realizadas.

### Interfaz y experiencia de usuario

- Para ADMIN, navegación lateral agrupada en Operaciones (Inventario, Movimientos de stock y Actualizar precios) y Administración (Panel de control y Auditoría). Inventario es la pantalla inicial.
- Para EMPLEADO, panel propio con Inventario como pantalla inicial, Movimientos de Stock y Alertas de inventario.
- Interfaz responsive para escritorio y dispositivos móviles.
- Formularios con validaciones.
- Desplazamiento suave hasta el formulario al editar un producto y etiquetas de filtros sin ancho fijo en el inventario.
- Estados de carga y mensajes de error.
- Tablas de inventario e historial.
- Tabla administrativa con precio, costo de compra, ganancia bruta y margen porcentual; tabla operativa del empleado sin datos económicos privados.
- Desplazamiento horizontal de tablas en pantallas pequeñas.
- Confirmación personalizada de eliminación.
- Mensajes de éxito al registrar operaciones.
- Comunicación con la API REST de Spring Boot.
- Formulario de inicio y cierre de sesión, con verificación de la sesión al recargar la página y visualización de pantallas según el rol.

## 📦 Modelo de datos

### Producto

Cada producto contiene los siguientes atributos persistidos:

- `id`
- `nombre`
- `stock`
- `stockMinimo`
- `precio`
- `costoCompra`
- `activo`

El atributo `activo` determina si un producto está habilitado para operar. Desactivar un producto no modifica sus existencias ni elimina su historial.

Para actualizar una base de datos existente que todavía no contiene esta columna, ejecutar una sola vez:

```sql
ALTER TABLE productos
ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
```

Para bases existentes sin la columna de stock mínimo, ejecutar una sola vez:

```sql
ALTER TABLE productos ADD COLUMN stock_minimo INT NOT NULL DEFAULT 0;
```

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

### Usuario

Cada usuario contiene:

- `id`
- `username` (único)
- `passwordHash` (persistido en la columna `password_hash`)
- `rol` (`ADMIN` o `EMPLEADO`)
- `activo`

El hash BCrypt se almacena en la tabla `usuarios`; la contraseña original no se persiste.

### AuditoriaAccion

Cada registro contiene:

- `id`
- `usuario`
- `accion` (`TipoAccionAuditoria`)
- `productoId` (opcional)
- `detalle`
- `fecha`

Se persiste en `auditoria_acciones`. El ID de producto es una referencia histórica y no una relación obligatoria con un producto existente. Los registros de sesión y las operaciones globales no necesitan un ID de producto.

## 🏗️ Arquitectura

El backend utiliza una arquitectura por capas, con **Spring Security** delante de los controladores para autenticar solicitudes, administrar sesiones y comprobar permisos:

**Controller → Service → Repository → MySQL**

- **Controller:** expone endpoints REST y recibe solicitudes HTTP.
- **Service:** implementa reglas de negocio, operaciones de stock y cálculos de rentabilidad.
- **Repository:** gestiona el acceso a MySQL mediante Spring Data JPA.
- **Entity:** representa los datos persistidos.
- **DTO:** define los datos que pueden enviarse o devolverse sin exponer campos innecesarios.

Entre los DTO utilizados se encuentran:

- `ProductoDTO` (información completa de productos para el administrador).
- `ProductoStockDTO` (consulta básica de ID, nombre y stock).
- `ProductoOperativoRequestDTO` y `ProductoOperativoResponseDTO` (gestión de productos sin costos ni márgenes).
- `MovimientoStockDTO` y `MovimientoStockResponseDTO`.
- `ActualizacionPreciosDTO`.
- `AuditoriaResponseDTO` (lectura del historial de auditoría).

La gestión operativa utiliza `ProductoOperativoController` y reutiliza las reglas de `ProductoService`, sin duplicar el CRUD ni los repositorios. La autorización por roles se centraliza en `SecurityConfig`.

`AuditoriaService` centraliza el registro de acciones y utiliza `AuditoriaRepository`. Los servicios de productos y movimientos registran las operaciones de negocio; los manejadores de Spring Security registran los inicios y cierres de sesión. `AuditoriaController` expone la consulta administrativa.

El manejo global de excepciones de negocio se implementa mediante `GlobalExceptionHandler`. La autenticación y los accesos no autorizados son gestionados por Spring Security, con `UsuarioRepository` y `UserDetailsService`.

El frontend está organizado en componentes y páginas React. `Acceso.jsx` comprueba la sesión y presenta el login; después muestra `App.jsx` para ADMIN o `PanelEmpleado.jsx` para EMPLEADO. El panel del empleado reutiliza `Movimientos.jsx` y ofrece `InventarioEmpleado.jsx` para el CRUD operativo.

El Panel de control administrativo reutiliza los endpoints `GET /productos` y `GET /movimientos` para calcular indicadores, agrupar movimientos por mes y filtrar estadísticas. Los reportes Excel se generan en el navegador mediante ExcelJS. La lógica común de creación de libros, hojas y descargas se concentra en `frontend/src/utils/excel.js`.

## 🌐 Endpoints de la API REST

### Autenticación y sesión

| Método | Endpoint       | Descripción                                                                      |
| ------ | -------------- | -------------------------------------------------------------------------------- |
| GET    | `/auth/csrf`   | Obtener el token CSRF de la sesión                                               |
| POST   | `/auth/login`  | Iniciar sesión con `username` y `password` (formulario URL encoded y token CSRF) |
| GET    | `/auth/me`     | Consultar el usuario autenticado y sus roles                                     |
| POST   | `/auth/logout` | Cerrar sesión e invalidarla (requiere token CSRF)                                |

El login y el logout son procesados por Spring Security. Las operaciones protegidas requieren una sesión válida; las solicitudes que modifican datos también necesitan un token CSRF válido.

### Productos administrativos — solo ADMIN

| Método | Endpoint                        | Descripción                                         |
| ------ | ------------------------------- | --------------------------------------------------- |
| POST   | `/productos`                    | Crear producto con precio de venta y costo opcional |
| GET    | `/productos`                    | Listar productos con información económica          |
| GET    | `/productos/{id}`               | Buscar producto por ID                              |
| GET    | `/productos/buscar?nombre=...`  | Buscar productos por nombre                         |
| PUT    | `/productos/{id}`               | Editar nombre, precio y costo de compra             |
| DELETE | `/productos/{id}`               | Eliminar producto sin movimientos asociados         |
| POST   | `/productos/actualizar-precios` | Aplicar aumento porcentual a todo el inventario     |

Estas respuestas incluyen ganancia bruta y margen porcentual calculados cuando se dispone de costo registrado.

### Productos operativos — ADMIN y EMPLEADO

| Método | Endpoint                    | Descripción                                                     |
| ------ | --------------------------- | --------------------------------------------------------------- |
| GET    | `/productos/stock`          | Listar únicamente ID, nombre y stock                            |
| GET    | `/operativo/productos`      | Listar ID, nombre, stock y precio de venta                      |
| GET    | `/operativo/productos/{id}` | Consultar un producto sin datos económicos privados             |
| POST   | `/operativo/productos`      | Crear producto sin permitir establecer costos                   |
| PUT    | `/operativo/productos/{id}` | Editar nombre y precio de venta, conservando el costo existente |
| DELETE | `/operativo/productos/{id}` | Eliminar producto si no tiene movimientos asociados             |

El endpoint `GET /operativo/productos/alertas-stock` lista únicamente productos activos agotados o con stock igual o inferior al mínimo. Ambos roles pueden consultarlo. Los DTO de productos incluyen `stockMinimo`.

Los endpoints operativos devuelven datos limitados por DTO. Un `costoCompra` enviado manualmente en una solicitud operativa no se asigna al producto.

### Movimientos de stock — ADMIN y EMPLEADO

| Método | Endpoint                             | Descripción                          |
| ------ | ------------------------------------ | ------------------------------------ |
| POST   | `/movimientos`                       | Registrar entrada o salida           |
| GET    | `/movimientos`                       | Listar movimientos                   |
| GET    | `/movimientos/producto/{productoId}` | Consultar movimientos de un producto |

Las operaciones de modificación requieren sesión válida y protección CSRF.

### Auditoría — solo ADMIN

| Método | Endpoint     | Descripción                                            |
| ------ | ------------ | ------------------------------------------------------ |
| GET    | `/auditoria` | Consultar hasta los últimos 100 registros de auditoría |

El endpoint requiere una sesión de administrador. EMPLEADO recibe `403 Forbidden` y una solicitud sin autenticación recibe `401 Unauthorized`. No se exponen operaciones de modificación ni eliminación del historial.

## 📡 Respuestas HTTP

La API utiliza códigos HTTP para comunicar el resultado de las operaciones.

- `200 OK`: consulta o actualización exitosa.
- `201 Created`: recurso creado correctamente.
- `204 No Content`: eliminación exitosa.
- `400 Bad Request`: datos inválidos, stock insuficiente u operación no permitida.
- `404 Not Found`: recurso inexistente.
- `401 Unauthorized`: acceso a un endpoint protegido sin sesión válida o credenciales de login incorrectas.
- `403 Forbidden`: acceso denegado por permisos insuficientes o por token CSRF ausente o inválido.

Los errores se procesan mediante un manejador global de excepciones y se devuelven al frontend para mostrar mensajes informativos.

## 🗄️ Base de datos

La aplicación utiliza MySQL.

**Base de datos de desarrollo:** `cerrajeria_db`

Tablas principales:

- `productos`
- `movimientos_stock`
- `usuarios`
- `auditoria_acciones`

La tabla `productos` almacena los datos principales de cada producto, incluyendo su precio de venta y costo de compra.

Los campos de ganancia bruta y margen porcentual no se almacenan en MySQL, ya que se calculan dinámicamente en el backend.

La tabla `movimientos_stock` contiene una clave foránea `producto_id` que relaciona cada movimiento con su producto.

Los cambios de stock se ejecutan mediante operaciones transaccionales para mantener la consistencia de los datos. La tabla `usuarios` conserva el nombre de usuario, el hash BCrypt, el rol y el estado de cada cuenta.

La tabla `auditoria_acciones` conserva el historial de actividad de los usuarios, independientemente de la existencia posterior de los productos referenciados.

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

### Panel de control

- Cálculo de indicadores de inventario y actualización del stock tras registrar movimientos.
- Valorización a costo registrado, cobertura de costos y valor potencial de venta.
- Agrupación de entradas y salidas por mes y cálculo de balances.
- Incorporación automática de un nuevo mes al registrar un movimiento.
- Ranking de productos y alertas de productos sin stock.
- Filtrado de estadísticas, gráficos, tabla y ranking por período.
- Visualización de mensajes de error al detener el backend y recuperación de datos mediante el botón de actualización.
- Descarga del reporte Excel de movimientos del Panel de control con resumen mensual, detalle y totales.
- Comprobación del filtro por mes y apertura del archivo en Excel.

### Actualización masiva de precios

- Validación y pruebas del endpoint de actualización porcentual mediante Postman.
- Vista previa y confirmación del aumento desde React.
- Comprobación de los precios actualizados y del recálculo de rentabilidad.
- Verificación de que los costos de compra y las existencias no se modifican por el aumento de precios.

### Reportes Excel

- Generación, descarga y apertura de los tres archivos `.xlsx` en Microsoft Excel.
- Verificación de las dos hojas de cada reporte, encabezados, columnas y filtros.
- Comparación de los totales del Panel de control con el detalle de movimientos.
- Exportación de los productos y comprobación de la valorización del inventario, la cobertura de costos y el margen bruto potencial.
- Verificación de que los productos sin costo registrado mantienen vacíos los campos de rentabilidad correspondientes.
- Comprobación de la exportación del historial completo y de los filtros combinados por tipo de movimiento y nombre de producto.
- Comparación del resumen del historial con los registros exportados, incluyendo balances negativos cuando solo se seleccionan salidas.

### Seguridad y autenticación

- Creación del administrador inicial en MySQL sin duplicarlo al reiniciar Spring Boot.
- Verificación de almacenamiento de contraseñas como hashes BCrypt.
- Acceso a `GET /productos` sin iniciar sesión: `401 Unauthorized`.
- Obtención del token CSRF: `GET /auth/csrf` → `200 OK`.
- Login de ADMIN y EMPLEADO desde Postman y React: `200 OK`.
- Verificación del usuario y rol mediante `GET /auth/me` (`ROLE_ADMIN` y `ROLE_EMPLEADO`).
- Logout con token CSRF: `204 No Content`; acceso posterior a productos protegidos: `401 Unauthorized`.
- Inicio y cierre de sesión desde React, incluidos los campos obligatorios del formulario.
- Acceso del administrador a Panel de control, Productos, Movimientos y Actualización de Precios.
- Acceso del empleado al inventario operativo y al historial de movimientos, sin mostrar información económica.
- Consulta de `GET /productos/stock` como empleado: `200 OK`, con ID, nombre y stock.
- Creación, edición y eliminación de productos temporales desde el perfil EMPLEADO, conservando la restricción de eliminación cuando hay historial.
- Edición del precio de venta de un producto existente como empleado: costo de compra y stock conservados; posterior verificación como administrador.
- Intento de edición mediante el endpoint administrativo `PUT /productos/{id}` con sesión de empleado: `403 Forbidden`.
- Envío intencional de `costoCompra` en `POST /operativo/productos`: `201 Created`, respuesta sin costo y comprobación posterior como administrador de que quedó **sin costo registrado**.
- Eliminación de los productos temporales utilizados en estas pruebas.

### Auditoría de acciones

- Creación de la tabla `auditoria_acciones` y verificación de registros en phpMyAdmin.
- Inicio y cierre de sesión de ADMIN y EMPLEADO con usuario y fecha correctos.
- Consulta de `GET /auditoria` como ADMIN (200), EMPLEADO (403) y sin sesión (401).
- Registro de creación, edición, eliminación, activación, desactivación, movimientos, cambios de stock mínimo y aumento masivo de precios.
- Visualización del historial y pruebas de filtros, búsqueda, rango de fechas y permisos en React.
- Pruebas de exportación del historial cargado y resultados filtrados a Excel.
- Comprobación de las mejoras de filtros y desplazamiento al editar en inventario.

El backend también fue compilado y empaquetado correctamente mediante Maven durante las etapas anteriores.

## 📌 Estado actual

**Backend MVP:** finalizado y ampliado con movimientos de stock, costos, precios, rentabilidad estimada, actualización masiva de precios, autenticación mediante Spring Security, autorización por roles con una API operativa separada y auditoría de acciones.

**Frontend React:** integrado con la API REST, con Panel de control, gestión administrativa, reportes Excel, login/logout, módulo de auditoría exclusivo de ADMIN y panel operativo de empleado con inventario, precios de venta y movimientos de stock.

**Base de datos MySQL:** integrada y operativa en desarrollo; incluye productos, movimientos, usuarios y registros de auditoría.

**Etapas completadas:**

- 09 — Panel de control de gestión.
- 10 — Actualización masiva de precios.
- 11 — Reportes y exportación a Excel.
- 12.1 — Usuarios y contraseñas.
- 12.2 — Seguridad del backend: login, sesiones, CSRF y logout.
- 12.3 — Login y sesión en React, con integración de los módulos.
- 12.4 — Permisos por rol, API operativa y pantallas para el empleado; pruebas funcionales y de protección de costos.
- 13 — Activación y desactivación de productos, filtros por estado, indicadores en el panel y protección de movimientos de stock.
- 14 — Stock mínimo y alertas de reposición para ambos roles; pulido de navegación, indicadores y reportes.
- 15 — Auditoría de acciones por usuario, permisos, historial con filtros, exportación a Excel y mejoras de usabilidad del inventario.

La aplicación funciona en el entorno local de desarrollo. **Aún no está desplegada en producción** y quedan verificaciones de seguridad y configuración antes de publicarla.

## 🖥️ Ejecución en desarrollo

1. Iniciar MySQL (en desarrollo, mediante WampServer) y utilizar la base de datos `cerrajeria_db`.
2. Ejecutar el backend Spring Boot desde IntelliJ IDEA. La API utiliza `http://localhost:8080`.
3. Para crear los usuarios iniciales, configurar las variables de entorno `CERRAJERIA_ADMIN_PASSWORD` y `CERRAJERIA_EMPLEADO_PASSWORD` con contraseñas seguras de al menos 12 caracteres (preferentemente diferentes). Si los usuarios ya existen, su creación inicial se omite.
4. Dentro de `frontend`, ejecutar `npm install` si es la primera vez y luego `npm run dev`.
5. Abrir `http://localhost:5173` e iniciar sesión como `admin` o `empleado`, según la interfaz que se quiera utilizar.

Las contraseñas **no se escriben en el código fuente ni se incluyen en el README**. Las URLs, permisos CORS y cookies deberán adaptarse antes del despliegue.

## 🚀 Próximas funcionalidades

**Etapa 16 — Ajustes de inventario.** Corrección de diferencias entre stock registrado y conteo físico, con motivo obligatorio y trazabilidad.

**Etapa 17 — Preparación y despliegue.** Configuración de producción, seguridad, respaldo de datos y puesta en línea.

**Mejoras posibles posteriores:** gestión de proveedores, importación de listas de precios y registro de ventas. Estas funcionalidades **todavía no forman parte de la versión implementada**.

## 🔎 Consideraciones antes del despliegue

- Revisar las versiones y vulnerabilidades de Spring Boot, Spring Security y dependencias del frontend (`npm audit`); actualizar a versiones compatibles y mantenidas.
- Configurar HTTPS, cookies seguras y una política CORS específica para el dominio de producción.
- Configurar URLs de la API, credenciales de MySQL y secretos mediante variables de entorno o un mecanismo de gestión de secretos, sin subirlos a GitHub.
- Revisar la estrategia de aprovisionamiento y administración de usuarios iniciales antes de operar con datos reales.
- Restringir y probar las operaciones de cada rol tanto en React como directamente contra la API REST.
- Revisar que las fechas y horas de los reportes coincidan con las del historial, incluyendo formato de 24 horas y zona horaria.
- Preparar copias de seguridad y una forma de restaurar la base de datos.
- Evaluar paginación y filtros de auditoría en el backend para consultar registros anteriores al límite de 100, además de definir políticas de conservación, zona horaria y protección del historial en producción.
- Realizar pruebas adicionales de seguridad y funcionamiento antes de publicar.

## 🎯 Objetivo del proyecto

CerrajeriaApp es un proyecto de portfolio orientado a aplicar conocimientos de desarrollo full stack, arquitectura por capas, APIs REST, persistencia de datos y reglas de negocio.

La aplicación busca evolucionar progresivamente hacia un sistema de gestión sencillo, confiable y utilizable en una cerrajería real.
