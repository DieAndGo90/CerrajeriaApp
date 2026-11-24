
package com.cerrajeria.cerrajeriaapp.dto;
//Este DTO representa los datos que el backend puede devolverle.
import java.math.BigDecimal;

public record ProductoOperativoResponseDTO(
        Long id,
        String nombre,
        Integer stock,
        BigDecimal precio,
        boolean activo
) {}