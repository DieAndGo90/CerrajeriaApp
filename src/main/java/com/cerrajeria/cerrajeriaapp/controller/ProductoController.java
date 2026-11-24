package com.cerrajeria.cerrajeriaapp.controller;

import com.cerrajeria.cerrajeriaapp.dto.ActualizacionPreciosDTO;
import com.cerrajeria.cerrajeriaapp.dto.ProductoDTO;
import com.cerrajeria.cerrajeriaapp.dto.ProductoStockDTO;
import com.cerrajeria.cerrajeriaapp.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/productos")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public List<ProductoDTO> listarProductos(
            @RequestParam(required = false) Boolean activo) {

        return productoService.listarProductos(activo);
    }

    @PostMapping
    public ResponseEntity<ProductoDTO> crearProducto(@Valid @RequestBody ProductoDTO productoDTO){

        ProductoDTO productoCreado = productoService.crearProducto(productoDTO);

        return ResponseEntity.status(201).body(productoCreado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoDTO> buscarPorId(@PathVariable Long id) {

        ProductoDTO producto = productoService.buscarPorId(id);

        return ResponseEntity.ok(producto);
    }

    @PutMapping("/{id}")
    public  ResponseEntity<ProductoDTO> editarProducto(@PathVariable Long id, @Valid @RequestBody ProductoDTO productoActualizado){

        ProductoDTO producto = productoService.editarProducto(id, productoActualizado);

        return ResponseEntity.ok(producto);
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<ProductoDTO> activarProducto(
            @PathVariable Long id) {

        ProductoDTO producto =
                productoService.cambiarEstadoProducto(id, true);

        return ResponseEntity.ok(producto);
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<ProductoDTO> desactivarProducto(
            @PathVariable Long id) {

        ProductoDTO producto =
                productoService.cambiarEstadoProducto(id, false);

        return ResponseEntity.ok(producto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id){

        productoService.eliminarProducto(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public List<ProductoDTO> buscarPorNombre(@RequestParam String nombre) {
        return productoService.buscarPorNombre(nombre);
    }

    @PostMapping("/actualizar-precios")
    public ResponseEntity<Map<String, Integer>> actualizarPrecios(
            @Valid @RequestBody ActualizacionPreciosDTO dto) {

        int cantidad = productoService
                .actualizarPreciosMasivamente(dto.getPorcentaje());

        return ResponseEntity.ok(
                Map.of("productosActualizados", cantidad)
        );
    }

    @GetMapping("/stock")
    public List<ProductoStockDTO> listarStock() {
        return productoService.listarStock();
    }

}
