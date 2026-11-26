package com.cerrajeria.cerrajeriaapp.repository;

import com.cerrajeria.cerrajeriaapp.entity.AuditoriaAccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<AuditoriaAccion, Long> {
    List<AuditoriaAccion> findTop100ByOrderByFechaDescIdDesc();
}
