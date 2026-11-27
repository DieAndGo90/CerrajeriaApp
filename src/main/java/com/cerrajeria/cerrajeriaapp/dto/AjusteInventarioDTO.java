package com.cerrajeria.cerrajeriaapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AjusteInventarioDTO {
    @NotNull(message = "El producto es obligatorio")
    @Positive(message = "El ID del producto debe ser positivo")
    private Long productoId;

    @NotNull(message = "El stock esperado es obligatorio")
    @PositiveOrZero(message = "El stock esperado no puede ser negativo")
    private Integer stockEsperado;

    @NotNull(message = "El stock real es obligatorio")
    @PositiveOrZero(message = "El stock real no puede ser negativo")
    private Integer stockReal;

    @NotBlank(message = "El motivo es obligatorio")
    @Size(max = 120, message = "El motivo admite hasta 120 caracteres")
    private String motivo;
}
