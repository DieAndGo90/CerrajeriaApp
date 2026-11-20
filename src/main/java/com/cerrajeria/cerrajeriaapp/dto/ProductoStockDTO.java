package com.cerrajeria.cerrajeriaapp.dto;

public record ProductoStockDTO(
        Long id,
        String nombre,
        Integer stock
) {
}