
package com.cerrajeria.cerrajeriaapp.controller;

import com.cerrajeria.cerrajeriaapp.dto.ProductoDTO;
import com.cerrajeria.cerrajeriaapp.dto.ProductoOperativoRequestDTO;
import com.cerrajeria.cerrajeriaapp.dto.ProductoOperativoResponseDTO;
import com.cerrajeria.cerrajeriaapp.service.ProductoService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/operativo/productos")
public class ProductoOperativoController {

    private final ProductoService productoService;

    public ProductoOperativoController(
            ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public List<ProductoOperativoResponseDTO> listar() {
        return productoService.listarProductos()
                .stream()
                .map(this::convertirRespuesta)
                .toList();
    }

    @GetMapping("/{id}")
    public ProductoOperativoResponseDTO buscar(
            @PathVariable Long id) {

        return convertirRespuesta(
                productoService.buscarPorId(id)
        );
    }

    @PostMapping
    public ResponseEntity<ProductoOperativoResponseDTO> crear(
            @Valid @RequestBody ProductoOperativoRequestDTO datos) {

        ProductoDTO creado = productoService.crearProducto(
                convertirSolicitud(datos)
        );

        return ResponseEntity.status(201)
                .body(convertirRespuesta(creado));
    }

    @PutMapping("/{id}")
    public ProductoOperativoResponseDTO editar(
            @PathVariable Long id,
            @Valid @RequestBody ProductoOperativoRequestDTO datos) {

        ProductoDTO actualizado = productoService.editarProducto(
                id,
                convertirSolicitud(datos)
        );

        return convertirRespuesta(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }

    private ProductoDTO convertirSolicitud(
            ProductoOperativoRequestDTO datos) {

        ProductoDTO dto = new ProductoDTO();
        dto.setNombre(datos.nombre());
        dto.setStock(datos.stock());
        dto.setPrecio(datos.precio());

        // El empleado nunca envía costos al servicio.
        dto.setCostoCompra(null);

        return dto;
    }

    private ProductoOperativoResponseDTO convertirRespuesta(
            ProductoDTO producto) {

        return new ProductoOperativoResponseDTO(
                producto.getId(),
                producto.getNombre(),
                producto.getStock(),
                producto.getPrecio()
        );
    }
}
