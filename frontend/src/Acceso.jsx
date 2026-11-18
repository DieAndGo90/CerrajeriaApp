import { useEffect, useState } from "react";
import App from "./App";
import "./Acceso.css";

const API_URL = "http://localhost:8080";

async function obtenerCsrf() {
  const respuesta = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include",
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo obtener el token CSRF");
  }

  return respuesta.json();
}

export default function Acceso() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;

    fetch(`${API_URL}/auth/me`, {
      credentials: "include",
    })
      .then(async (respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (activo) setUsuario(datos);
      })
      .catch(() => {
        if (activo) setUsuario(null);
      })
      .finally(() => {
        if (activo) setVerificando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  async function iniciarSesion(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const csrf = await obtenerCsrf();

      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          [csrf.headerName]: csrf.token,
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (!respuesta.ok) {
        throw new Error(
          respuesta.status === 401
            ? "Usuario o contraseña incorrectos"
            : "No se pudo iniciar sesión",
        );
      }

      const respuestaUsuario = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (!respuestaUsuario.ok) {
        throw new Error("No se pudo verificar la sesión");
      }

      const datos = await respuestaUsuario.json();

      setUsuario(datos);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarSesion() {
    try {
      const csrf = await obtenerCsrf();

      const respuesta = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          [csrf.headerName]: csrf.token,
        },
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo cerrar sesión");
      }

      setUsuario(null);
      setUsername("");
      setPassword("");
    } catch (err) {
      alert(err.message);
    }
  }

  if (verificando) {
    return (
      <div className="acceso-pantalla">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (usuario) {
    return (
      <>
        <div className="acceso-barra">
          <span>Usuario: {usuario.username}</span>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>

        <App />
      </>
    );
  }

  return (
    <div className="acceso-pantalla">
      <form className="acceso-tarjeta" onSubmit={iniciarSesion}>
        <div className="acceso-logo">🔐</div>

        <h1>CerrajeriaApp</h1>
        <p>Sistema de gestión de cerrajería</p>

        <h2>Iniciar sesión</h2>

        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="acceso-error">{error}</p>}

        <button className="acceso-ingresar" type="submit" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
