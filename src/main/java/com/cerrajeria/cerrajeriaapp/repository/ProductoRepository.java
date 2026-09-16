package com.cerrajeria.cerrajeriaapp.repository;

import com.cerrajeria.cerrajeriaapp.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByNombreContainingIgnoreCase(String nombre);

}
