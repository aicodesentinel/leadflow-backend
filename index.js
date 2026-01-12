const express = require("express");
const cors = require("cors");

const app = express();

// Render usa PORT dinámico
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Ruta raíz para que NO salga Not Found
app.get("/", (req, res) => {
  res.status(200).send("✅ leadflow-backend online. Try /health or /api");
});

// ✅ Health check (para Render y para ti)
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, status: "healthy" });
});

// ✅ Ruta base de API (ejemplo)
app.get("/api", (req, res) => {
  res.status(200).json({ message: "API running", endpoints: ["/", "/health", "/api"] });
});

// ❌ Ruta “catch-all” para ver claro cuando algo no existe
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
    hint: "Try /, /health, /api"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
