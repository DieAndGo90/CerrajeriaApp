# 🔐 CerrajeriaApp

Sistema web de gestión de inventario para una cerrajería, desarrollado como proyecto full stack con **Java, Spring Boot, React y MySQL**.

El objetivo es construir una aplicación funcional que permita administrar productos, controlar existencias, registrar movimientos de stock y consultar costos, precios y rentabilidad estimada, aplicando buenas prácticas de desarrollo de software.

Actualmente, CerrajeriaApp incluye un Dashboard de gestión con indicadores de inventario, valorización de mercadería, estadísticas históricas, filtros por período y alertas de productos agotados. También permite actualizar masivamente los precios de venta, generar reportes Excel de inventario y movimientos de stock y **acceder mediante un login con sesiones protegidas por Spring Security**.

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

- Usuario administrador persistido en MySQL, con contraseña almacenada mediante hash BCrypt.
- Roles `ADMIN` y `EMPLEADO` definidos en el backend (la autorización diferenciada por rol todavía está pendiente).
- Creación del administrador inicial al arrancar el backend si aún no existe y se configuró la variable de entorno `CERRAJERIA_ADMIN_PASSWORD`.
- Login desde React con nombre de usuario y contraseña, validado por Spring Security contra MySQL.
- Autenticación mediante sesión HTTP y cookie `JSESSIONID` (sin JWT).
- Protección de endpoints: las operaciones de productos, movimientos y actualización de precios exigen una sesión autenticada.
- Protección CSRF activa en las solicitudes que modifican datos, incluyendo login y logout.
- Configuración CORS para el frontend de desarrollo con envío de credenciales.
- Verificación de sesión al cargar React y botón para cerrar sesión, invalidando la sesión del servidor.
- Cliente reutilizable `frontend/src/apiFetch.js` para enviar cookies y tokens CSRF en las solicitudes al backend.

**Estado actual de los permisos:** existe un rol para cada usuario, pero todavía no se aplican restricciones distintas para `ADMIN` y `EMPLEADO`. Actualmente, cualquier usuario autenticado tiene acceso a las operaciones protegidas; la separación de permisos se desarrollará en la etapa **12.4**.

### Actualización masiva de precios

- Actualización porcentual de los precios de venta de todo el inventario.
- Vista previa de los nuevos precios y diferencias antes de aplicar los cambios.
- Confirmación previa a la actualización masiva.
- Validación de porcentajes positivos.
- Actualización transaccional de precios mediante Spring Boot y JPA.
- Conservación de los costos de compra y las existencias.
- Recálculo automático de la ganancia bruta y el margen de rentabilidad.
- Actualización automática del listado de productos después de confirmar la operación.

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
- Editar nombre, precio de venta y costo de compra.
- Eliminar productos sin movimientos asociados.
- Confirmación antes de eliminar.
- Indicadores visuales de productos sin stock.
- Contador de productos registrados.
- Validaciones y mensajes de éxito o error.
- Exportación del inventario completo a Excel, independientemente de la búsqueda activa.

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

### Reportes y exportación a Excel

Los reportes se generan desde React mediante ExcelJS y se descargan como archivos `.xlsx`, utilizando los datos de la API REST existente. No requieren endpoints adicionales ni cambios en el modelo de datos.

**Reporte del Dashboard:**

- Hoja `Resumen mensual`: mes, unidades ingresadas, unidades retiradas, balance y fila de totales.
- Hoja `Detalle movimientos`: fecha y hora, ID del producto, nombre, tipo, cantidad y observación.
- Ambas hojas respetan el período seleccionado en el Dashboard (un mes o todo el historial).

**Reporte de inventario:**

- Hoja `Inventario`: ID, producto, stock, estado del stock, costo unitario, precio de venta, ganancia bruta por unidad, margen bruto, costo total del stock, venta potencial, ganancia potencial y estado del costo.
- Hoja `Resumen económico`: fecha de generación, productos registrados, unidades disponibles, productos agotados, cobertura de costos, valorización a costo registrado, venta potencial, ganancia bruta potencial y margen bruto potencial.
- Consulta el inventario completo mediante `GET /productos`, sin depender de los resultados de la búsqueda en pantalla.
- Diferencia los costos no registrados de los costos iguales a cero.

**Reporte del historial de movimientos:**

- Hoja `Historial de movimientos`: ID del movimiento, fecha y hora, ID del producto, nombre, tipo, cantidad y observación, ordenados del más reciente al más antiguo.
- Hoja `Resumen del historial`: fecha de generación, filtros aplicados, cantidad de movimientos y productos involucrados, cantidad de registros de entrada y salida, unidades ingresadas y retiradas, y balance de unidades.
- Respeta la combinación de filtros por tipo de movimiento y nombre de producto.

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
- La edición de productos permite modificar nombre, precio y costo, pero no directamente el stock.
- Los productos con movimientos registrados no pueden eliminarse.
- Los productos nuevos con stock inicial positivo generan automáticamente un movimiento de entrada con la observación "Stock inicial".
- La creación del producto y el registro de su stock inicial se realizan dentro de una misma transacción.
- El precio de venta debe ser mayor que cero.
- El costo de compra no puede ser negativo.
- El costo de compra puede permanecer sin registrar temporalmente.
- Si un producto no tiene costo registrado, no se calcula su ganancia ni su margen.
- Los cálculos de ganancia bruta y margen por producto se realizan en el backend; React calcula los indicadores agregados del Dashboard y los reportes a partir de los datos recibidos de la API.
- La ganancia potencial del inventario se calcula únicamente para los productos con costo registrado. El margen bruto potencial se obtiene dividiendo esa ganancia por el valor potencial de venta del mismo conjunto de productos.
- El balance de movimientos (entradas menos salidas) representa la variación de unidades en la selección, no necesariamente el stock actual.
- Los reportes económicos representan valores potenciales a los precios actuales, no ventas ni ganancias efectivamente realizadas.

### Interfaz y experiencia de usuario

- Navegación lateral entre Dashboard, Productos, Movimientos de Stock y Actualizar precios, con el Dashboard como pantalla inicial.
- Interfaz responsive para escritorio y dispositivos móviles.
- Formularios con validaciones.
- Estados de carga y mensajes de error.
- Tablas de inventario e historial.
- Tabla de productos con precio, costo de compra, ganancia bruta y margen porcentual.
- Desplazamiento horizontal de tablas en pantallas pequeñas.
- Confirmación personalizada de eliminación.
- Mensajes de éxito al registrar operaciones.
- Comunicación con la API REST de Spring Boot.
- Formulario de inicio de sesión y cierre de sesión, con verificación de la sesión al recargar la página.

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

### Usuario

Cada usuario contiene:

- `id`
- `username` (único)
- `passwordHash` (persistido en la columna `password_hash`)
- `rol` (`ADMIN` o `EMPLEADO`)
- `activo`

El hash BCrypt se almacena en la tabla `usuarios`; la contraseña original no se persiste.

## 🏗️ Arquitectura

El backend utiliza una arquitectura por capas, con **Spring Security** delante de los controladores para autenticar solicitudes y administrar sesiones:

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
- `ActualizacionPreciosDTO`

El manejo global de excepciones de negocio se implementa mediante `GlobalExceptionHandler`. La autenticación y los accesos no autenticados son gestionados por Spring Security a través de `SecurityConfig`, `UsuarioRepository` y `UserDetailsService`.

El frontend está organizado en componentes y páginas React, separando la navegación y las páginas de Dashboard, Productos, Movimientos de Stock y Actualización de Precios. El componente `Acceso.jsx` comprueba la sesión y presenta el login antes de mostrar `App.jsx`.

El Dashboard reutiliza los endpoints `GET /productos` y `GET /movimientos` para calcular indicadores, agrupar movimientos por mes y filtrar estadísticas. Los reportes Excel reutilizan los datos de la API y se generan en el navegador mediante ExcelJS. La lógica común de creación de libros, hojas y descarga se concentra en `frontend/src/utils/excel.js`. No se requieren endpoints adicionales para los reportes.

## 🌐 Endpoints de la API REST

### Autenticación y sesión

| Método | Endpoint       | Descripción                                                                      |
| ------ | -------------- | -------------------------------------------------------------------------------- |
| GET    | `/auth/csrf`   | Obtener el token CSRF de la sesión                                               |
| POST   | `/auth/login`  | Iniciar sesión con `username` y `password` (formulario URL encoded y token CSRF) |
| GET    | `/auth/me`     | Consultar el usuario y sus autoridades, con sesión iniciada                      |
| POST   | `/auth/logout` | Cerrar sesión e invalidarla (requiere token CSRF)                                |

El login y el logout son procesados por Spring Security. Los endpoints de productos y movimientos requieren autenticación; las solicitudes que modifican datos también necesitan un token CSRF válido.

### Productos

| Método | Endpoint                        | Descripción                                         |
| ------ | ------------------------------- | --------------------------------------------------- |
| POST   | `/productos`                    | Crear producto con precio de venta y costo opcional |
| GET    | `/productos`                    | Listar productos con información comercial          |
| GET    | `/productos/{id}`               | Buscar producto por ID                              |
| GET    | `/productos/buscar?nombre=...`  | Buscar productos por nombre                         |
| PUT    | `/productos/{id}`               | Editar nombre, precio y costo de compra             |
| DELETE | `/productos/{id}`               | Eliminar producto sin movimientos asociados         |
| POST   | `/productos/actualizar-precios` | Aplicar un aumento porcentual a todos los productos |

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
- `401 Unauthorized`: acceso a un endpoint protegido sin sesión válida o credenciales de login incorrectas.
- `403 Forbidden`: solicitud rechazada, por ejemplo, por un token CSRF ausente o inválido.

Los errores se procesan mediante un manejador global de excepciones y se devuelven al frontend para mostrar mensajes informativos.

## 🗄️ Base de datos

La aplicación utiliza MySQL.

**Base de datos de desarrollo:** `cerrajeria_db`

Tablas principales:

- `productos`
- `movimientos_stock`
- `usuarios`

La tabla `productos` almacena los datos principales de cada producto, incluyendo su precio de venta y costo de compra.

Los campos de ganancia bruta y margen porcentual no se almacenan en MySQL, ya que se calculan dinámicamente en el backend.

La tabla `movimientos_stock` contiene una clave foránea `producto_id` que relaciona cada movimiento con su producto.

Los cambios de stock se ejecutan mediante operaciones transaccionales para mantener la consistencia de los datos. La tabla `usuarios` conserva el nombre de usuario, el hash BCrypt, el rol y el estado de cada cuenta.

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
- Descarga del reporte Excel de movimientos del Dashboard con resumen mensual, detalle y totales.
- Comprobación del filtro por mes y apertura del archivo en Excel.

### Actualización masiva de precios

- Validación y pruebas del endpoint de actualización porcentual mediante Postman.
- Vista previa y confirmación del aumento desde React.
- Comprobación de los precios actualizados y del recálculo de rentabilidad.
- Verificación de que los costos de compra y las existencias no se modifican por el aumento de precios.

### Reportes Excel

- Generación, descarga y apertura de los tres archivos `.xlsx` en Microsoft Excel.
- Verificación de las dos hojas de cada reporte, encabezados, columnas y filtros.
- Comparación de los totales del Dashboard con el detalle de movimientos.
- Exportación de los productos y comprobación de la valorización del inventario, la cobertura de costos y el margen bruto potencial.
- Verificación de que los productos sin costo registrado mantienen vacíos los campos de rentabilidad correspondientes.
- Comprobación de la exportación del historial completo y de los filtros combinados por tipo de movimiento y nombre de producto.
- Comparación del resumen del historial con los registros exportados, incluyendo balances negativos cuando solo se seleccionan salidas.

### Seguridad y autenticación

- Creación del administrador inicial en MySQL sin duplicarlo al reiniciar Spring Boot.
- Verificación de almacenamiento de la contraseña como hash BCrypt.
- Acceso a `GET /productos` sin iniciar sesión: `401 Unauthorized`.
- Obtención del token CSRF: `GET /auth/csrf` → `200 OK`.
- Login del administrador desde Postman y React: `200 OK`.
- Verificación de usuario y rol mediante `GET /auth/me` (`ROLE_ADMIN`).
- Consulta de productos después de iniciar sesión: `200 OK`.
- Logout con token CSRF: `204 No Content`.
- Acceso a productos después del logout: `401 Unauthorized`.
- Inicio y cierre de sesión desde React, incluidos los campos obligatorios del formulario.
- Carga de Dashboard, Productos, Movimientos y Actualización de Precios con sesión iniciada.
- Creación, edición y eliminación de un producto temporal desde React con sesión y CSRF.

El backend también fue compilado y empaquetado correctamente mediante Maven durante las etapas anteriores.

## 📌 Estado actual

**Backend MVP:** finalizado y ampliado con movimientos de stock, costos, precios, cálculos de rentabilidad, actualización masiva de precios y autenticación mediante Spring Security.

**Frontend React:** integrado con la API REST, con Dashboard, productos, movimientos, actualización de precios, reportes Excel y pantalla de login con cierre de sesión.

**Base de datos MySQL:** integrada y operativa en desarrollo; incluye productos, movimientos y usuarios.

**Etapas completadas:**

- 09 — Dashboard de gestión.
- 10 — Actualización masiva de precios.
- 11 — Reportes y exportación a Excel.
- 12.1 — Usuarios y contraseñas.
- 12.2 — Seguridad del backend: login, sesiones, CSRF y logout.
- 12.3 — Login y sesión en React, con integración de los cuatro módulos.

El sistema funciona en el entorno local de desarrollo con autenticación. **Todavía falta autorizar las operaciones según el rol**, además de preparar la aplicación para producción y desplegarla.

## 🖥️ Ejecución en desarrollo

1. Iniciar MySQL (en desarrollo, mediante WampServer) y utilizar la base de datos `cerrajeria_db`.
2. Ejecutar el backend Spring Boot desde IntelliJ IDEA. La API utiliza `http://localhost:8080`.
3. Para crear el primer administrador, configurar en la ejecución del backend la variable de entorno `CERRAJERIA_ADMIN_PASSWORD` con una contraseña segura (al menos 12 caracteres). La creación inicial se omite si ya existe un usuario con rol `ADMIN`.
4. Dentro de `frontend`, ejecutar `npm install` si es la primera vez y luego `npm run dev`.
5. Abrir `http://localhost:5173` e iniciar sesión con el usuario `admin` y la contraseña configurada.

La contraseña no se escribe en el código fuente ni se incluye en este README. Las URLs, permisos CORS y cookies deberán adaptarse antes del despliegue.

## 🚀 Próximas funcionalidades

**Próximo bloque: 12.4 — Roles y permisos.** Aplicar autorización real en el backend y ajustar la interfaz según los permisos de `ADMIN` y `EMPLEADO`. Por ahora solamente está implementada la autenticación.

Otras mejoras previstas para futuras etapas:

- Alertas de stock mínimo.
- Registro de ventas e ingresos.
- Gestión de proveedores.
- Importación y actualización de listas de precios de proveedores.
- Historial de cambios de costos y precios.
- Mejoras adicionales de experiencia de usuario.
- Preparación y despliegue de la aplicación.

Estas funcionalidades todavía no forman parte de la versión actual.

## 🔎 Consideraciones antes del despliegue

- Implementar la autorización por roles en el **backend**, no solo ocultar botones en React.
- Revisar las versiones y vulnerabilidades de Spring Boot, Spring Security y dependencias del frontend (`npm audit`); actualizar a versiones compatibles y mantenidas.
- Configurar HTTPS, cookies seguras y una política CORS específica para el dominio de producción.
- Configurar URLs de la API, credenciales de MySQL y secretos mediante variables de entorno o un mecanismo de gestión de secretos, sin subirlos a GitHub.
- Revisar que las fechas y horas de los reportes coincidan con las del historial, incluyendo formato de 24 horas y zona horaria.
- Probar nuevamente las operaciones sensibles con permisos diferenciados y completar las verificaciones de seguridad antes de publicar.

## 🎯 Objetivo del proyecto

CerrajeriaApp es un proyecto de portfolio orientado a aplicar conocimientos de desarrollo full stack, arquitectura por capas, APIs REST, persistencia de datos y reglas de negocio.

La aplicación busca evolucionar progresivamente hacia un sistema de gestión sencillo, confiable y utilizable en una cerrajería real.
