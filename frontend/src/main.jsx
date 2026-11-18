import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Acceso from "./Acceso.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Acceso />
  </StrictMode>,
);
