package com.cerrajeria.cerrajeriaapp.config;

import com.cerrajeria.cerrajeriaapp.entity.Usuario;
import com.cerrajeria.cerrajeriaapp.entity.TipoAccionAuditoria;
import com.cerrajeria.cerrajeriaapp.service.AuditoriaService;
import com.cerrajeria.cerrajeriaapp.repository.UsuarioRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Content-Type",
                "X-CSRF-TOKEN"
        ));

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public UserDetailsService userDetailsService(
            UsuarioRepository usuarioRepository) {

        return username -> {

            Usuario usuario = usuarioRepository
                    .findByUsername(username)
                    .orElseThrow(() ->
                            new UsernameNotFoundException(
                                    "Usuario no encontrado"
                            )
                    );

            return User.withUsername(usuario.getUsername())
                    .password(usuario.getPasswordHash())
                    .roles(usuario.getRol().name())
                    .disabled(!usuario.isActivo())
                    .build();
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuditoriaService auditoriaService) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(Customizer.withDefaults())

                .authorizeHttpRequests(auth -> auth

                        // Login y obtención del token CSRF
                        .requestMatchers(
                                "/auth/csrf",
                                "/auth/login"
                        ).permitAll()

                        // Consultar el usuario autenticado
                        .requestMatchers("/auth/me")
                        .authenticated()

                        // Consultar stock: ADMIN y EMPLEADO
                        .requestMatchers(
                                HttpMethod.GET,
                                "/productos/stock"
                        )
                        .hasAnyRole("ADMIN", "EMPLEADO")

                        // Gestión operativa: ADMIN y EMPLEADO
                        .requestMatchers(
                                "/operativo/productos",
                                "/operativo/productos/**"
                        )
                        .hasAnyRole("ADMIN", "EMPLEADO")

                        // Productos: temporalmente solo ADMIN
                        .requestMatchers("/productos", "/productos/**")
                        .hasRole("ADMIN")

                        // Consultar movimientos
                        .requestMatchers(
                                HttpMethod.GET,
                                "/movimientos",
                                "/movimientos/**"
                        ).hasAnyRole("ADMIN", "EMPLEADO")

                        // Registrar entradas y salidas
                        .requestMatchers(HttpMethod.POST, "/movimientos")
                        .hasAnyRole("ADMIN", "EMPLEADO")

                        // Auditoria: solo ADMIN
                        .requestMatchers(HttpMethod.GET, "/auditoria")
                        .hasRole("ADMIN")

                        // Cualquier otra ruta no autorizada expresamente
                        .anyRequest().denyAll()
                )

                .formLogin(form -> form
                        .loginProcessingUrl("/auth/login")

                        .successHandler((request, response, authentication) -> {
                            auditoriaService.registrar(authentication.getName(),
                                    TipoAccionAuditoria.INICIO_SESION, null,
                                    "Inicio de sesion exitoso");
                            response.setStatus(200);
                        })

                        .failureHandler((request, response, exception) -> {
                            response.setStatus(401);
                        })
                )

                .logout(logout -> logout
                        .logoutUrl("/auth/logout")

                        .logoutSuccessHandler((request, response, authentication) -> {
                            if (authentication != null && authentication.isAuthenticated()) {
                                auditoriaService.registrar(authentication.getName(),
                                        TipoAccionAuditoria.CIERRE_SESION, null,
                                        "Cierre de sesion");
                            }
                            response.setStatus(204);
                        })
                )

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                        )
                )

                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
