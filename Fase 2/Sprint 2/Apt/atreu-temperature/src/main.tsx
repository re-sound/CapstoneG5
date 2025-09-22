import { createRoot } from "react-dom/client";
import "./index.css";

// Test de vida: crea un div rojo y luego renderiza la App real
const el = document.getElementById("root")!;
el.innerHTML = `<div style="padding:8px;background:#ef4444;color:white;border-radius:8px">Cargando App...</div>`;

import App from "./App";
createRoot(el).render(<App />);
