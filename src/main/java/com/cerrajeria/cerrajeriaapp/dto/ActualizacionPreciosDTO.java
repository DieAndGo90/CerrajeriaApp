package com.cerrajeria.cerrajeriaapp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ActualizacionPreciosDTO {

    @NotNull(message = "El porcentaje es obligatorio")
    @Positive(message = "El porcentaje debe ser mayor a cero")
    private BigDecimal porcentaje;
}