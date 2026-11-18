package com.cerrajeria.cerrajeriaapp.repository;

import com.cerrajeria.cerrajeriaapp.entity.Usuario;
import com.cerrajeria.cerrajeriaapp.entity.Rol;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository
        extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    boolean existsByRol(Rol rol);
}