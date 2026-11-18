const API_URL = "http://localhost:8080";

export async function apiFetch(url, opciones = {}) {
  const metodo = (opciones.method || "GET").toUpperCase();

  const headers = new Headers(opciones.headers);

  if (!["GET", "HEAD", "OPTIONS"].includes(metodo)) {
    const respuestaCsrf = await fetch(`${API_URL}/auth/csrf`, {
      credentials: "include",
    });

    if (!respuestaCsrf.ok) {
      throw new Error("No se pudo obtener el token CSRF");
    }

    const csrf = await respuestaCsrf.json();

    headers.set(csrf.headerName, csrf.token);
  }

  return fetch(url, {
    ...opciones,
    headers,
    credentials: "include",
  });
}
