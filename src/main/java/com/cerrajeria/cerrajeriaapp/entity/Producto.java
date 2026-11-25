package com.cerrajeria.cerrajeriaapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Getter @Setter
@NoArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private Integer stock;

    @Column(nullable = false)
    private Integer stockMinimo = 0;

    private BigDecimal precio;

    private BigDecimal costoCompra;

    @Column(nullable = false)
    private boolean activo = true;
}
