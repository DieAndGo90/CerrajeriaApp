package com.cerrajeria.cerrajeriaapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_acciones")
@Getter @Setter
@NoArgsConstructor
public class AuditoriaAccion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoAccionAuditoria accion;

    private Long productoId;

    @Column(nullable = false, length = 2000)
    private String detalle;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
