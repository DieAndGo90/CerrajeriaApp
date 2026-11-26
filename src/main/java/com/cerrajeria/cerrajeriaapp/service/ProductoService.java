package com.cerrajeria.cerrajeriaapp.service;

import com.cerrajeria.cerrajeriaapp.dto.ProductoDTO;
import com.cerrajeria.cerrajeriaapp.dto.ProductoStockDTO;
import com.cerrajeria.cerrajeriaapp.entity.Producto;
import com.cerrajeria.cerrajeriaapp.exception.ProductoNoEncontradoException;
import com.cerrajeria.cerrajeriaapp.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import com.cerrajeria.cerrajeriaapp.entity.TipoAccionAuditoria;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.cerrajeria.cerrajeriaapp.entity.TipoMovimiento;
import org.springframework.transaction.annotation.Transactional;
import com.cerrajeria.cerrajeriaapp.repository.MovimientoStockRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final MovimientoStockService movimientoStockService;
    private final MovimientoStockRepository movimientoStockRepository;
    private final AuditoriaService auditoriaService;

    public ProductoService(
            ProductoRepository productoRepository,
            MovimientoStockService movimientoStockService,
            MovimientoStockRepository movimientoStockRepository,
            AuditoriaService auditoriaService) {

        this.productoRepository = productoRepository;
        this.movimientoStockService = movimientoStockService;
        this.movimientoStockRepository = movimientoStockRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<ProductoDTO> listarProductos(){

        List<Producto> productos = productoRepository.findAll();

        List<ProductoDTO> productosDTO = new ArrayList<>();

        for (Producto producto : productos) {
            productosDTO.add(convertirADTO(producto));
        }
        return productosDTO;
    }

    public List<ProductoDTO> listarProductos(Boolean activo) {

        return productoRepository.findAll()
                .stream()
                .filter(producto ->
                        activo == null || producto.isActivo() == activo)
                .map(this::convertirADTO)
                .toList();
    }

    @Transactional
    public ProductoDTO crearProducto(ProductoDTO productoDTO) {

        Integer stockInicial = productoDTO.getStock();

        if (stockInicial == null || stockInicial < 0) {
            throw new IllegalArgumentException(
                    "El stock inicial debe ser 0 o mayor"
            );
        }

        Producto producto = convertirAEntidad(productoDTO);

        // EL PRODUCTO SE CREA CON STOCK 0
        producto.setStock(0);

        Producto productoGuardado = productoRepository.save(producto);

        auditoriaService.registrar(usuarioActual(), TipoAccionAuditoria.CREAR_PRODUCTO,
                productoGuardado.getId(), "Producto: " + productoGuardado.getNombre()
                        + "; precio: " + productoGuardado.getPrecio()
                        + "; costo: " + productoGuardado.getCostoCompra()
                        + "; stock minimo: " + productoGuardado.getStockMinimo()
                        + "; stock inicial solicitado: " + stockInicial);

        // REGISTRAR EL STOCK INICIAL COMO ENTRADA
        if (stockInicial > 0) {
            movimientoStockService.registrarMovimiento(
                    productoGuardado.getId(),
                    TipoMovimiento.ENTRADA,
                    stockInicial,
                    "Stock inicial"
            );
        }

        return convertirADTO(productoGuardado);
    }

    public ProductoDTO buscarPorId(Long id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        return convertirADTO(producto);
    }

    @Transactional
    public ProductoDTO editarProducto(Long id, ProductoDTO productoActualizado) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        String nombreAnterior = producto.getNombre();
        BigDecimal precioAnterior = producto.getPrecio();
        BigDecimal costoAnterior = producto.getCostoCompra();
        Integer minimoAnterior = producto.getStockMinimo();

        producto.setNombre(productoActualizado.getNombre());
        producto.setPrecio(productoActualizado.getPrecio());

        if (productoActualizado.getStockMinimo() != null) {
            producto.setStockMinimo(
                    productoActualizado.getStockMinimo()
            );
        }

        if (productoActualizado.getCostoCompra() != null) {
            producto.setCostoCompra(productoActualizado.getCostoCompra());
        }

        Producto productoGuardado = productoRepository.save(producto);

        List<String> cambios = new ArrayList<>();
        if (!Objects.equals(nombreAnterior, productoGuardado.getNombre())) {
            cambios.add("Nombre: " + nombreAnterior + " -> " + productoGuardado.getNombre());
        }
        if (importeDistinto(precioAnterior, productoGuardado.getPrecio())) {
            cambios.add("Precio: " + precioAnterior + " -> " + productoGuardado.getPrecio());
        }
        if (importeDistinto(costoAnterior, productoGuardado.getCostoCompra())) {
            cambios.add("Costo: " + costoAnterior + " -> " + productoGuardado.getCostoCompra());
        }
        if (!cambios.isEmpty()) {
            auditoriaService.registrar(usuarioActual(), TipoAccionAuditoria.EDITAR_PRODUCTO,
                    id, "Producto: " + productoGuardado.getNombre() + "; " + String.join("; ", cambios));
        }
        if (!Objects.equals(minimoAnterior, productoGuardado.getStockMinimo())) {
            auditoriaService.registrar(usuarioActual(), TipoAccionAuditoria.MODIFICAR_STOCK_MINIMO,
                    id, "Producto: " + productoGuardado.getNombre() + "; stock minimo: "
                            + minimoAnterior + " -> " + productoGuardado.getStockMinimo());
        }

        return convertirADTO(productoGuardado);
    }

    @Transactional
    public ProductoDTO cambiarEstadoProducto(Long id, boolean activo) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ProductoNoEncontradoException(id));

        boolean estadoAnterior = producto.isActivo();
        if (estadoAnterior == activo) {
            return convertirADTO(producto);
        }
        producto.setActivo(activo);

        Producto productoGuardado = productoRepository.save(producto);

        auditoriaService.registrar(usuarioActual(),
                activo ? TipoAccionAuditoria.ACTIVAR_PRODUCTO : TipoAccionAuditoria.DESACTIVAR_PRODUCTO,
                id, "Producto: " + productoGuardado.getNombre() + "; estado: "
                        + (estadoAnterior ? "activo" : "inactivo") + " -> "
                        + (activo ? "activo" : "inactivo"));

        return convertirADTO(productoGuardado);
    }

    @Transactional
    public void eliminarProducto(Long id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        // IMPEDIR ELIMINAR PRODUCTOS CON HISTORIAL
        if (movimientoStockRepository.existsByProductoId(id)) {
            throw new IllegalArgumentException(
                    "No se puede eliminar un producto con movimientos de stock registrados."
            );
        }

        String nombre = producto.getNombre();
        productoRepository.deleteById(id);
        auditoriaService.registrar(usuarioActual(), TipoAccionAuditoria.ELIMINAR_PRODUCTO,
                id, "Producto eliminado: " + nombre);
    }

    public List<ProductoDTO> buscarPorNombre(String nombre) {

        List<Producto> productos =
                productoRepository.findByNombreContainingIgnoreCase(nombre);

        List<ProductoDTO> productosDTO = new ArrayList<>();

        for (Producto producto : productos) {
            productosDTO.add(convertirADTO(producto));
        }
        return productosDTO;
    }

    @Transactional
    public int actualizarPreciosMasivamente(BigDecimal porcentaje) {

        if (porcentaje == null || porcentaje.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "El porcentaje debe ser mayor a cero"
            );
        }

        List<Producto> productos = productoRepository.findAll();

        BigDecimal factor = BigDecimal.ONE.add(
                porcentaje.divide(BigDecimal.valueOf(100))
        );

        for (Producto producto : productos) {

            BigDecimal nuevoPrecio = producto.getPrecio()
                    .multiply(factor)
                    .setScale(2, RoundingMode.HALF_UP);

            producto.setPrecio(nuevoPrecio);
        }

        productoRepository.saveAll(productos);

        if (!productos.isEmpty()) {
            auditoriaService.registrar(usuarioActual(), TipoAccionAuditoria.ACTUALIZAR_PRECIOS,
                    null, "Aumento: " + porcentaje.toPlainString() + "%; productos procesados: "
                            + productos.size());
        }
        return productos.size();
    }

    private String usuarioActual() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || !autenticacion.isAuthenticated()
                || autenticacion instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("No hay un usuario autenticado para auditar");
        }
        return autenticacion.getName();
    }

    private boolean importeDistinto(BigDecimal anterior, BigDecimal nuevo) {
        if (anterior == null || nuevo == null) {
            return anterior != nuevo;
        }
        return anterior.compareTo(nuevo) != 0;
    }

    private ProductoDTO convertirADTO(Producto producto) {
        ProductoDTO dto = new ProductoDTO();

        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setStock(producto.getStock());
        dto.setStockMinimo(producto.getStockMinimo());
        dto.setPrecio(producto.getPrecio());
        dto.setCostoCompra(producto.getCostoCompra());
        dto.setActivo(producto.isActivo());
        if (producto.getCostoCompra() != null
                && producto.getPrecio() != null) {

            dto.setGananciaBruta(
                    producto.getPrecio().subtract(producto.getCostoCompra())
            );

            if (producto.getPrecio().compareTo(BigDecimal.ZERO) > 0) {

                BigDecimal margen = dto.getGananciaBruta()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(producto.getPrecio(), 2, RoundingMode.HALF_UP);

                dto.setMargenPorcentaje(margen);
            }
        }

        return dto;
    }

    private Producto convertirAEntidad(ProductoDTO dto) {
        Producto producto = new Producto();

        producto.setNombre(dto.getNombre());
        producto.setStock(dto.getStock());
        producto.setStockMinimo(
                dto.getStockMinimo() != null
                        ? dto.getStockMinimo()
                        : 0
        );
        producto.setPrecio(dto.getPrecio());
        producto.setCostoCompra(dto.getCostoCompra());

        return producto;
    }

    public List<ProductoStockDTO> listarStock() {
        return productoRepository.findAll()
                .stream()
                .filter(Producto::isActivo)
                .map(producto -> new ProductoStockDTO(
                        producto.getId(),
                        producto.getNombre(),
                        producto.getStock()
                ))
                .toList();
    }

    public List<ProductoDTO> listarAlertasStock() {

        return productoRepository.findAll()
                .stream()
                .filter(Producto::isActivo)
                .filter(producto ->
                        producto.getStock() <= producto.getStockMinimo())
                .map(this::convertirADTO)
                .toList();
    }

}
