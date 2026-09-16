# CerrajeriaApp

Sistema web de gestión para una cerrajería.

El proyecto está siendo desarrollado como una aplicación full stack, comenzando por un backend REST con Spring Boot y MySQL.

## Tecnologías

### Backend
- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Maven
- Lombok

### Base de datos
- MySQL

### Frontend
- React (próximamente)

## Funcionalidades actuales

- Crear productos
- Listar productos
- Buscar productos por ID
- Buscar productos por nombre
- Editar productos
- Eliminar productos
- Validación de datos
- Manejo de errores HTTP

## Producto

Cada producto posee:

- id
- nombre
- stock
- precio

## Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/productos` | Crear producto |
| GET | `/productos` | Listar productos |
| GET | `/productos/{id}` | Buscar producto por ID |
| GET | `/productos/buscar?nombre=...` | Buscar productos por nombre |
| PUT | `/productos/{id}` | Editar producto |
| DELETE | `/productos/{id}` | Eliminar producto |

## Base de datos

La aplicación utiliza MySQL.

Base utilizada durante el desarrollo:

```text
cerrajeria_db