package com.cerrajeria.cerrajeriaapp.controller;

import com.cerrajeria.cerrajeriaapp.dto.ProductoDTO;
import com.cerrajeria.cerrajeriaapp.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public List<ProductoDTO> listarProductos(){
        return productoService.listarProductos();
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id){

        productoService.eliminarProducto(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public List<ProductoDTO> buscarPorNombre(@RequestParam String nombre) {
        return productoService.buscarPorNombre(nombre);
    }



}
