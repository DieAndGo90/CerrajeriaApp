
package com.cerrajeria.cerrajeriaapp.dto;
//Este DTO representa los datos que el empleado puede enviar al backend.
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record ProductoOperativoRequestDTO(

        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotNull(message = "El stock es obligatorio")
        @PositiveOrZero(message = "El stock no puede ser negativo")
        Integer stock,

        @NotNull(message = "El precio es obligatorio")
        @Positive(message = "El precio debe ser mayor a cero")
        BigDecimal precio

) {}
