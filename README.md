# CerrajeriaApp

Sistema web de gestión para una cerrajería.

El proyecto está siendo desarrollado como una aplicación full stack con Spring Boot, React y MySQL.

El Backend MVP se encuentra finalizado y probado. El frontend en React ya está integrado con la API REST y permite gestionar productos de punta a punta.

El frontend MVP se encuentra integrado y pulido, con una interfaz responsive y manejo visual de los principales estados de la aplicación.

Actualmente el backend incorpora un módulo de movimientos de stock que permite registrar entradas y salidas, actualizar automáticamente el stock de los productos y consultar el historial de movimientos.

## Tecnologías

### Backend

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Maven
- Lombok
- Bean Validation

### Base de datos

- MySQL

### Frontend

- React
- Vite
- Fetch API
- CSS

## Funcionalidades actuales

- Crear productos
- Listar productos
- Buscar productos por ID
- Buscar productos por nombre
- Limpiar búsqueda y volver al inventario completo
- Editar productos
- Cancelar edición
- Eliminar productos con confirmación
- Indicador visual de productos sin stock
- Mensajes de éxito y error
- Estado de carga
- Estado vacío cuando no hay resultados
- Diseño responsive
- Validación de datos
- Uso de DTOs
- Manejo global de excepciones
- Respuestas HTTP adecuadas
- Registrar entradas de stock
- Registrar salidas de stock
- Actualización automática del stock
- Validación de stock insuficiente
- Historial de movimientos de stock
- Consulta de movimientos por producto
- Movimientos ordenados por fecha
- Persistencia transaccional de productos y movimientos

## Estado del Backend MVP

Backend MVP finalizado y probado.

Se verificaron correctamente:

- Creación de productos
- Listado de productos
- Búsqueda por ID
- Búsqueda por nombre
- Edición de productos
- Eliminación de productos
- Validación de datos
- Manejo de productos inexistentes
- Respuestas HTTP adecuadas
- Persistencia en MySQL
- Compilación y empaquetado con Maven

La aplicación fue probada mediante Postman y el proyecto compila correctamente con Java 17 mediante Maven (`BUILD SUCCESS`).

## Movimientos de Stock

El backend incorpora un módulo para administrar entradas y salidas del inventario.

Cada movimiento posee:

- id
- producto
- tipo (`ENTRADA` o `SALIDA`)
- cantidad
- fecha

Al registrar un movimiento:

- Una `ENTRADA` aumenta automáticamente el stock del producto.
- Una `SALIDA` disminuye automáticamente el stock.
- No se permite realizar una salida superior al stock disponible.
- No se permiten cantidades iguales o menores a cero.
- Se valida que el producto exista.
- Cada movimiento queda registrado como historial en MySQL.

La actualización del producto y el registro del movimiento se ejecutan dentro de una transacción para mantener la consistencia de los datos.

`MovimientoStock` posee una relación `ManyToOne` con `Producto`, permitiendo asociar múltiples movimientos a un mismo producto.

El módulo fue probado mediante Postman verificando entradas, salidas, validaciones, manejo de errores y persistencia en MySQL.

## Estado del Frontend MVP

Frontend desarrollado con React y Vite e integrado con la API REST de Spring Boot.

Actualmente permite gestionar el inventario de productos de punta a punta e incluye:

- Interfaz de administración con sidebar
- Formulario para crear y editar productos
- Buscador por nombre
- Limpieza de filtros de búsqueda
- Tabla de inventario
- Contador de productos
- Indicadores visuales de stock
- Confirmación personalizada antes de eliminar
- Cancelación de edición
- Mensajes de éxito y error
- Indicador de carga
- Estado visual cuando no existen resultados
- Diseño responsive para distintos tamaños de pantalla
- Manejo de errores cuando el backend no se encuentra disponible

El frontend fue probado junto con el backend verificando las operaciones de creación, búsqueda, edición y eliminación.

## Producto

Cada producto posee:

- id
- nombre
- stock
- precio

## Arquitectura

El backend utiliza una arquitectura simple por capas:

Controller → Service → Repository → MySQL

Los productos utilizan `ProductoDTO` para el intercambio de datos con la API.

Los movimientos de stock utilizan `MovimientoStockDTO` para recibir los datos de una operación y `MovimientoStockResponseDTO` para devolver respuestas controladas al cliente.

Las entidades `Producto` y `MovimientoStock` representan los datos persistidos en MySQL.

## Endpoints

| Método | Endpoint                       | Descripción                 |
| ------ | ------------------------------ | --------------------------- |
| POST   | `/productos`                   | Crear producto              |
| GET    | `/productos`                   | Listar productos            |
| GET    | `/productos/{id}`              | Buscar producto por ID      |
| GET    | `/productos/buscar?nombre=...` | Buscar productos por nombre |
| PUT    | `/productos/{id}`              | Editar producto             |
| DELETE | `/productos/{id}`              | Eliminar producto           |

### Movimientos de Stock

| Método | Endpoint                             | Descripción                         |
| ------ | ------------------------------------ | ----------------------------------- |
| POST   | `/movimientos`                       | Registrar entrada o salida de stock |
| GET    | `/movimientos`                       | Listar todos los movimientos       |
| GET    | `/movimientos/producto/{productoId}` | Listar movimientos de un producto  |

## Respuestas HTTP

- `200 OK` - Consulta o edición realizada correctamente
- `201 Created` - Recurso creado correctamente
- `204 No Content` - Producto eliminado correctamente
- `400 Bad Request` - Datos inválidos
- `404 Not Found` - Recurso solicitado no encontrado

## Base de datos

La aplicación utiliza MySQL.

Base utilizada durante el desarrollo:

```text
cerrajeria_db
```

Actualmente contiene las tablas principales:

- `productos`
- `movimientos_stock`

La tabla `movimientos_stock` se relaciona con `productos` mediante la clave foránea `producto_id`.
