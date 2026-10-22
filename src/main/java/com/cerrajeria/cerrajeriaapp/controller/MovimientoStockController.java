package com.cerrajeria.cerrajeriaapp.controller;

import com.cerrajeria.cerrajeriaapp.dto.MovimientoStockDTO;
import com.cerrajeria.cerrajeriaapp.dto.MovimientoStockResponseDTO;
import com.cerrajeria.cerrajeriaapp.entity.MovimientoStock;
import com.cerrajeria.cerrajeriaapp.service.MovimientoStockService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/movimientos")
public class MovimientoStockController {

    private final MovimientoStockService movimientoStockService;

    public MovimientoStockController(MovimientoStockService movimientoStockService) {
        this.movimientoStockService = movimientoStockService;
    }

    @PostMapping
    public ResponseEntity<MovimientoStockResponseDTO> registrarMovimiento(
            @Valid @RequestBody MovimientoStockDTO dto) {

        MovimientoStockResponseDTO movimiento =
                movimientoStockService.registrarMovimiento(
                dto.getProductoId(),
                dto.getTipo(),
                dto.getCantidad()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(movimiento);
    }

    @GetMapping
    public ResponseEntity<List<MovimientoStockResponseDTO>> listarMovimientos() {

        List<MovimientoStockResponseDTO> movimientos =
                movimientoStockService.listarMovimientos();

        return ResponseEntity.ok(movimientos);
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<MovimientoStockResponseDTO>> listarMovimientosPorProducto(
            @PathVariable Long productoId) {

        List<MovimientoStockResponseDTO> movimientos =
                movimientoStockService.listarMovimientosPorProducto(productoId);

        return ResponseEntity.ok(movimientos);
    }
}