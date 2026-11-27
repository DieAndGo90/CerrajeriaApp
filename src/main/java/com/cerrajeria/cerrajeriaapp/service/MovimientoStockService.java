package com.cerrajeria.cerrajeriaapp.service;

import com.cerrajeria.cerrajeriaapp.dto.MovimientoStockResponseDTO;
import com.cerrajeria.cerrajeriaapp.dto.AjusteInventarioDTO;
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

        Producto producto = productoRepository.buscarParaActualizarStock(productoId)
                .orElseThrow(() -> new ProductoNoEncontradoException(productoId));
        //validar que el producto esté activo
        if (!producto.isActivo()) {
            throw new IllegalArgumentException(
                    "No se pueden registrar movimientos en un producto inactivo"
            );
        }
        return guardarMovimiento(producto, tipo, cantidad, observacion, false);
    }

    @Transactional
    public MovimientoStockResponseDTO ajustarInventario(AjusteInventarioDTO dto) {
        Producto producto = productoRepository.buscarParaActualizarStock(dto.getProductoId())
                .orElseThrow(() -> new ProductoNoEncontradoException(dto.getProductoId()));

        if (!producto.isActivo()) {
            throw new IllegalArgumentException("No se puede ajustar un producto inactivo");
        }

        int stockAnterior = producto.getStock();
        if (stockAnterior != dto.getStockEsperado()) {
            throw new IllegalArgumentException("El stock cambio. Actualiza el inventario y vuelve a verificar el conteo.");
        }

        int diferencia = dto.getStockReal() - stockAnterior;
        if (diferencia == 0) {
            throw new IllegalArgumentException("El stock real coincide con el registrado; no hay ajuste");
        }

        TipoMovimiento tipo = diferencia > 0 ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA;
        String observacion = "AJUSTE DE INVENTARIO | Stock: " + stockAnterior
                + " -> " + dto.getStockReal() + " | Motivo: " + dto.getMotivo().trim();

        return guardarMovimiento(producto, tipo, Math.abs(diferencia), observacion, true);
    }

    private MovimientoStockResponseDTO guardarMovimiento(Producto producto,
            TipoMovimiento tipo, Integer cantidad, String observacion, boolean ajuste) {
        Long productoId = producto.getId();
        // Registrar el cambio de stock y el movimiento en la misma transaccion.
        int stockAnterior = producto.getStock();
        if (tipo == TipoMovimiento.ENTRADA) {
            if (cantidad > Integer.MAX_VALUE - producto.getStock()) {
                throw new IllegalArgumentException("El stock supera el maximo permitido");
            }
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
                ajuste ? TipoAccionAuditoria.AJUSTE_INVENTARIO :
                        (tipo == TipoMovimiento.ENTRADA ? TipoAccionAuditoria.ENTRADA_STOCK : TipoAccionAuditoria.SALIDA_STOCK),
                productoId, "Producto: " + producto.getNombre()
                        + "; movimiento ID: " + movimientoGuardado.getId()
                        + "; cantidad: " + cantidad
                        + "; stock: " + stockAnterior + " -> " + producto.getStock()
                        + (ajuste ? "; " + observacion : ""));

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
