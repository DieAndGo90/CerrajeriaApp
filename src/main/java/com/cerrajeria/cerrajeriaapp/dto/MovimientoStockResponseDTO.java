package com.cerrajeria.cerrajeriaapp.dto;

import com.cerrajeria.cerrajeriaapp.entity.TipoMovimiento;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MovimientoStockResponseDTO {

    private Long id;

    private Long productoId;

    private String productoNombre;

    private TipoMovimiento tipo;

    private Integer cantidad;

    private LocalDateTime fecha;
}