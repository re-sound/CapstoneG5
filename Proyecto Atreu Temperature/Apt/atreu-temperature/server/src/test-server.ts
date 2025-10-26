import express from "express";
import cors from "cors";

/**
 * Script simple para probar el servidor
 */

const app = express();
app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "Servidor funcionando correctamente" });
});

const PORT = 4001; // Puerto diferente para evitar conflictos
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba ejecutándose en http://localhost:${PORT}`);
  console.log("✅ Servidor funcionando correctamente");
});
