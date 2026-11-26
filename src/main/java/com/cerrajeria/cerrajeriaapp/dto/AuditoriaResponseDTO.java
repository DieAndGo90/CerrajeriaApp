package com.cerrajeria.cerrajeriaapp.dto;

import com.cerrajeria.cerrajeriaapp.entity.TipoAccionAuditoria;
import java.time.LocalDateTime;

public record AuditoriaResponseDTO(
        Long id,
        String usuario,
        TipoAccionAuditoria accion,
        Long productoId,
        String detalle,
        LocalDateTime fecha
) {}
