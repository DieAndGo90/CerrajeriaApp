package com.cerrajeria.cerrajeriaapp.service;

import com.cerrajeria.cerrajeriaapp.dto.AuditoriaResponseDTO;
import com.cerrajeria.cerrajeriaapp.entity.AuditoriaAccion;
import com.cerrajeria.cerrajeriaapp.entity.TipoAccionAuditoria;
import com.cerrajeria.cerrajeriaapp.repository.AuditoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditoriaService {
    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional
    public void registrar(String usuario, TipoAccionAuditoria accion,
                          Long productoId, String detalle) {
        AuditoriaAccion registro = new AuditoriaAccion();
        registro.setUsuario(usuario);
        registro.setAccion(accion);
        registro.setProductoId(productoId);
        registro.setDetalle(detalle);
        registro.setFecha(LocalDateTime.now());
        auditoriaRepository.save(registro);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponseDTO> listar() {
        return auditoriaRepository.findTop100ByOrderByFechaDescIdDesc()
                .stream()
                .map(registro -> new AuditoriaResponseDTO(
                        registro.getId(),
                        registro.getUsuario(),
                        registro.getAccion(),
                        registro.getProductoId(),
                        registro.getDetalle(),
                        registro.getFecha()
                ))
                .toList();
    }
}
