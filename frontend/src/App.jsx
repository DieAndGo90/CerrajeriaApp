import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // ESTADOS DE LOS PRODUCTOS
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // ESTADOS DEL FORMULARIO
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("");
  const [precio, setPrecio] = useState("");

  const [mensaje, setMensaje] = useState("");

  // CARGAR PRODUCTOS DEL BACKEND
  useEffect(() => {
    fetch("http://localhost:8080/productos")
      .then((respuesta) => respuesta.json())
      .then((datos) => setProductos(datos))
      .catch((error) => {
        console.error("Error al cargar los productos:", error);
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // CREAR NUEVO PRODUCTO
  const guardarProducto = (e) => {
    e.preventDefault();

    const producto = {
      nombre: nombre,
      stock: Number(stock),
      precio: Number(precio),
    };

    const editando = idEditando !== null;

    const url = editando
      ? `http://localhost:8080/productos/${idEditando}`
      : "http://localhost:8080/productos";

    const metodo = editando ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo guardar el producto");
        }

        return respuesta.json();
      })
      .then((productoGuardado) => {
        if (editando) {
          setProductos(
            productos.map((productoActual) =>
              productoActual.id === idEditando
                ? productoGuardado
                : productoActual,
            ),
          );
        } else {
          setProductos([...productos, productoGuardado]);
        }

        setNombre("");
        setStock("");
        setPrecio("");
        setIdEditando(null);
      })
      .catch((error) => {
        console.error("Error al guardar el producto:", error);
      });
  };

  // EDITAR PRODUCTO
  const prepararEdicion = (producto) => {
    setIdEditando(producto.id);
    setNombre(producto.nombre);
    setStock(producto.stock);
    setPrecio(producto.precio);
  };

  // ELIMINAR PRODUCTO
  const eliminarProducto = (id) => {
    const confirmado = window.confirm(
      "¿Seguro que querés eliminar este producto?",
    );

    if (!confirmado) {
      return;
    }

    fetch(`http://localhost:8080/productos/${id}`, {
      method: "DELETE",
    })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo eliminar el producto");
        }

        setProductos(productos.filter((producto) => producto.id !== id));

        setMensaje("Producto eliminado correctamente.");

        setTimeout(() => {
          setMensaje("");
        }, 2000);
      })
      .catch((error) => {
        console.error("Error al eliminar el producto:", error);
      });
  };

  // BUSCAR PRODUCTOS
  const buscarProductos = (e) => {
    e.preventDefault();

    const termino = busqueda.trim();

    const url = termino
      ? `http://localhost:8080/productos/buscar?nombre=${encodeURIComponent(termino)}`
      : "http://localhost:8080/productos";

    setLoading(true);
    setError("");

    fetch(url)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo realizar la búsqueda");
        }

        return respuesta.json();
      })
      .then((datos) => {
        setProductos(datos);
      })
      .catch((error) => {
        console.error("Error al buscar productos:", error);
        setError("No se pudieron buscar los productos.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      <header>
        <h1>CerrajeríaApp</h1>
      </header>

      <main>
        <h2>Productos</h2>
        <p>Gestión de productos de la cerrajería.</p>

        <form onSubmit={buscarProductos}>
          <label>Buscar producto:</label>

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: Yale"
          />

          <button type="submit">Buscar</button>
        </form>

        {mensaje && <p>{mensaje}</p>}

        <form onSubmit={guardarProducto}>
          <h3>{idEditando ? "Editar producto" : "Nuevo producto"}</h3>

          <div>
            <label>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Stock:</label>
            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Precio:</label>
            <input
              type="number"
              min="0"
              step="1"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
              placeholder="Ej: 14500"
            />
          </div>

          <button type="submit">
            {idEditando ? "Guardar cambios" : "Guardar producto"}
          </button>
        </form>

        {loading && <p>Cargando productos...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && (
          <table className="productos-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.id}</td>
                  <td>{producto.nombre}</td>
                  <td>{producto.stock}</td>
                  <td>${Number(producto.precio).toLocaleString("es-AR")}</td>

                  <td className="acciones">
                    <button onClick={() => prepararEdicion(producto)}>
                      Editar
                    </button>

                    <button onClick={() => eliminarProducto(producto.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;
