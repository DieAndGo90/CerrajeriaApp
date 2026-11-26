package com.cerrajeria.cerrajeriaapp.service;

import com.cerrajeria.cerrajeriaapp.dto.MovimientoStockResponseDTO;
import com.cerrajeria.cerrajeriaapp.entity.MovimientoStock;
import com.cerrajeria.cerrajeriaapp.entity.Producto;
import com.cerrajeria.cerrajeriaapp.entity.TipoMovimiento;
import com.cerrajeria.cerrajeriaapp.exception.ProductoNoEncontradoException;
import com.cerrajeria.cerrajeriaapp.repository.MovimientoStockRepository;
import com.cerrajeria.cerrajeriaapp.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import com.cerrajeria.cerrajeriaapp.entity.TipoAccionAuditoria;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MovimientoStockService {

    private final MovimientoStockRepository movimientoStockRepository;
    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;

    public MovimientoStockService(
            MovimientoStockRepository movimientoStockRepository,
            ProductoRepository productoRepository,
            AuditoriaService auditoriaService) {

        this.movimientoStockRepository = movimientoStockRepository;
        this.productoRepository = productoRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public MovimientoStockResponseDTO registrarMovimiento(
            Long productoId,
            TipoMovimiento tipo,
            Integer cantidad,
            String observacion) {

        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        }

        if (tipo == null) {
            throw new IllegalArgumentException("El tipo de movimiento es obligatorio");
        }

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ProductoNoEncontradoException(productoId));
        //validar que el producto esté activo
        if (!producto.isActivo()) {
            throw new IllegalArgumentException(
                    "No se pueden registrar movimientos en un producto inactivo"
            );
        }
        //registrar entrada
        int stockAnterior = producto.getStock();
        if (tipo == TipoMovimiento.ENTRADA) {
            producto.setStock(producto.getStock() + cantidad);
        }

        if (tipo == TipoMovimiento.SALIDA) {

            if (producto.getStock() < cantidad) {
                throw new IllegalArgumentException("Stock insuficiente");
            }

            producto.setStock(producto.getStock() - cantidad);
        }
        productoRepository.save(producto);

        MovimientoStock movimiento = new MovimientoStock();

        movimiento.setProducto(producto);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setObservacion(observacion);
        movimiento.setFecha(LocalDateTime.now());

        MovimientoStock movimientoGuardado =
                movimientoStockRepository.save(movimiento);

        auditoriaService.registrar(usuarioActual(),
                tipo == TipoMovimiento.ENTRADA ? TipoAccionAuditoria.ENTRADA_STOCK : TipoAccionAuditoria.SALIDA_STOCK,
                productoId, "Producto: " + producto.getNombre()
                        + "; movimiento ID: " + movimientoGuardado.getId()
                        + "; cantidad: " + cantidad
                        + "; stock: " + stockAnterior + " -> " + producto.getStock());

        return convertirADTO(movimientoGuardado);
    }

    public List<MovimientoStockResponseDTO> listarMovimientos() {

        List<MovimientoStock> movimientos = movimientoStockRepository.findAll();

        return movimientos.stream()
                .map(this::convertirADTO)
                .toList();
    }

    public List<MovimientoStockResponseDTO> listarMovimientosPorProducto(Long productoId) {

        if (!productoRepository.existsById(productoId)) {
            throw new ProductoNoEncontradoException(productoId);
        }

        List<MovimientoStock> movimientos = movimientoStockRepository
                .findByProductoIdOrderByFechaDesc(productoId);

        return movimientos.stream()
                .map(this::convertirADTO)
                .toList();
    }

    private String usuarioActual() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || !autenticacion.isAuthenticated()
                || autenticacion instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("No hay un usuario autenticado para auditar");
        }
        return autenticacion.getName();
    }

    private MovimientoStockResponseDTO convertirADTO(MovimientoStock movimiento) {

        MovimientoStockResponseDTO dto = new MovimientoStockResponseDTO();

        dto.setId(movimiento.getId());
        dto.setProductoId(movimiento.getProducto().getId());
        dto.setProductoNombre(movimiento.getProducto().getNombre());
        dto.setTipo(movimiento.getTipo());
        dto.setCantidad(movimiento.getCantidad());
        dto.setObservacion(movimiento.getObservacion());
        dto.setFecha(movimiento.getFecha());

        return dto;
    }

}
