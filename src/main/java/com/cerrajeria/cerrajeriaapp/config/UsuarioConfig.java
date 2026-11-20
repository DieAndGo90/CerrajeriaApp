package com.cerrajeria.cerrajeriaapp.config;

import com.cerrajeria.cerrajeriaapp.entity.Rol;
import com.cerrajeria.cerrajeriaapp.entity.Usuario;
import com.cerrajeria.cerrajeriaapp.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;

@Configuration
public class UsuarioConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public ApplicationRunner crearAdministrador(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${CERRAJERIA_ADMIN_PASSWORD:}")
            String adminPassword) {

        return args -> {

            if (usuarioRepository.existsByRol(Rol.ADMIN)) {
                return;
            }

            if (adminPassword.isBlank()) {
                System.out.println(
                        "No se configuró la contraseña inicial del administrador."
                );
                return;
            }

            if (adminPassword.length() < 12 ||
                    adminPassword.getBytes(StandardCharsets.UTF_8).length > 72) {

                throw new IllegalArgumentException(
                        "La contraseña debe tener al menos 12 caracteres "
                                + "y no superar los 72 bytes."
                );
            }

            if (usuarioRepository.findByUsername("admin").isPresent()) {
                throw new IllegalStateException(
                        "El nombre de usuario admin ya existe."
                );
            }

            Usuario admin = new Usuario();

            admin.setUsername("admin");
            admin.setPasswordHash(
                    passwordEncoder.encode(adminPassword)
            );
            admin.setRol(Rol.ADMIN);
            admin.setActivo(true);

            usuarioRepository.save(admin);

            System.out.println(
                    "Administrador inicial creado correctamente."
            );
        };
    }

    @Bean
    public ApplicationRunner crearEmpleado(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${CERRAJERIA_EMPLEADO_PASSWORD:}")
            String empleadoPassword) {

        return args -> {

            // Evitar crear usuarios duplicados
            if (usuarioRepository.findByUsername("empleado").isPresent()) {
                return;
            }

            // Si no hay contraseña configurada, no crear el usuario
            if (empleadoPassword.isBlank()) {
                System.out.println(
                        "No se configuró la contraseña del empleado."
                );
                return;
            }

            // Validar longitud de contraseña
            if (empleadoPassword.length() < 12 ||
                    empleadoPassword.getBytes(
                            StandardCharsets.UTF_8
                    ).length > 72) {

                throw new IllegalArgumentException(
                        "La contraseña del empleado debe tener " +
                                "al menos 12 caracteres y no superar 72 bytes."
                );
            }

            Usuario empleado = new Usuario();

            empleado.setUsername("empleado");
            empleado.setPasswordHash(
                    passwordEncoder.encode(empleadoPassword)
            );
            empleado.setRol(Rol.EMPLEADO);
            empleado.setActivo(true);

            usuarioRepository.save(empleado);

            System.out.println(
                    "Usuario empleado creado correctamente."
            );
        };
    }

}