package com.cerrajeria.cerrajeriaapp.controller;

import com.cerrajeria.cerrajeriaapp.entity.Producto;
import com.cerrajeria.cerrajeriaapp.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public List<Producto> listarProductos(){
        return productoService.listarProductos();
    }

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@Valid @RequestBody Producto producto){

        Producto productoCreado = productoService.crearProducto(producto);

        return ResponseEntity.status(201).body(productoCreado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> buscarPorId(@PathVariable Long id){

        Optional<Producto> producto = productoService.buscarPorId(id);

        if (producto.isPresent()){
            return ResponseEntity.ok(producto.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public  ResponseEntity<Producto> editarProducto(@PathVariable Long id, @Valid @RequestBody Producto productoActualizado){

        Optional<Producto> producto = productoService.editarProducto(id, productoActualizado);

        if (producto.isPresent()){
            return ResponseEntity.ok(producto.get());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void>  eliminarProducto(@PathVariable Long id){

        boolean eliminado = productoService.eliminarProducto(id);

        if (eliminado){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/buscar")
    public List<Producto> buscarPorNombre(@RequestParam String nombre) {
        return productoService.buscarPorNombre(nombre);
    }



}
