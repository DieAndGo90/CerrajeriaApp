package com.cerrajeria.cerrajeriaapp.service;

import com.cerrajeria.cerrajeriaapp.dto.ProductoDTO;
import com.cerrajeria.cerrajeriaapp.entity.Producto;
import com.cerrajeria.cerrajeriaapp.exception.ProductoNoEncontradoException;
import com.cerrajeria.cerrajeriaapp.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import com.cerrajeria.cerrajeriaapp.entity.TipoMovimiento;
import org.springframework.transaction.annotation.Transactional;
import com.cerrajeria.cerrajeriaapp.repository.MovimientoStockRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final MovimientoStockService movimientoStockService;
    private final MovimientoStockRepository movimientoStockRepository;

    public ProductoService(
            ProductoRepository productoRepository,
            MovimientoStockService movimientoStockService,
            MovimientoStockRepository movimientoStockRepository) {

        this.productoRepository = productoRepository;
        this.movimientoStockService = movimientoStockService;
        this.movimientoStockRepository = movimientoStockRepository;
    }

    public List<ProductoDTO> listarProductos(){

        List<Producto> productos = productoRepository.findAll();

        List<ProductoDTO> productosDTO = new ArrayList<>();

        for (Producto producto : productos) {
            productosDTO.add(convertirADTO(producto));
        }
        return productosDTO;
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

    public ProductoDTO editarProducto(Long id, ProductoDTO productoActualizado) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        producto.setNombre(productoActualizado.getNombre());
        producto.setPrecio(productoActualizado.getPrecio());

        if (productoActualizado.getCostoCompra() != null) {
            producto.setCostoCompra(productoActualizado.getCostoCompra());
        }

        Producto productoGuardado = productoRepository.save(producto);

        return convertirADTO(productoGuardado);
    }

    public void eliminarProducto(Long id) {

        if (!productoRepository.existsById(id)) {
            throw new ProductoNoEncontradoException(id);
        }

        // IMPEDIR ELIMINAR PRODUCTOS CON HISTORIAL
        if (movimientoStockRepository.existsByProductoId(id)) {
            throw new IllegalArgumentException(
                    "No se puede eliminar un producto con movimientos de stock registrados."
            );
        }

        productoRepository.deleteById(id);
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

        return productos.size();
    }

    private ProductoDTO convertirADTO(Producto producto) {
        ProductoDTO dto = new ProductoDTO();

        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setStock(producto.getStock());
        dto.setPrecio(producto.getPrecio());
        dto.setCostoCompra(producto.getCostoCompra());
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
        producto.setPrecio(dto.getPrecio());
        producto.setCostoCompra(dto.getCostoCompra());

        return producto;
    }


}
