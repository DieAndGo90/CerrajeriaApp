package com.cerrajeria.cerrajeriaapp.repository;

import com.cerrajeria.cerrajeriaapp.entity.MovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {

    List<MovimientoStock> findByProductoIdOrderByFechaDesc(Long productoId);
}
