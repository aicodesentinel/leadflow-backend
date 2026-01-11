// ===============================
// LEADFLOW BACKEND (MINI)
// Edita rápido estas variables:
// ===============================

// [EDITA] Nombre de tu proyecto (solo texto)
const PROJECT_NAME = "LeadFlow Lite";

// [EDITA] Puerto: Render lo pone solo, NO lo cambies
const PORT = process.env.PORT || 3000;

const express = require("express");
const cors = require("cors");

const app = express();

// ===============================
// CORS (para que tu frontend pueda llamar al backend)
// ===============================
// [EDITA] En producción puedes restringir el origen.
// Por ahora, dejamos abierto para practicar sin trabas.
app.use(cors());

// ===============================
// Parseo JSON
// ===============================
app.use(express.json());

// ===============================
// RUTA BASE (prueba rápida)
// ===============================
app.get("/", (req, res) => {
  res.send(`✅ ${PROJECT_NAME} backend corriendo`);
});

// ===============================
// API: Hola
// ===============================
app.get("/api/hello", (req, res) => {
  res.json({
    ok: true,
    project: PROJECT_NAME,
    message: "Hola desde tu backend en Render 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// API: Recibir lead (formulario)
// ===============================
// Frontend manda: { name, phone, message }
app.post("/api/lead", (req, res) => {
  // [EDITA] Campos esperados (puedes agregar email, etc.)
  const { name, phone, message } = req.body || {};

  // Validación mínima (para practicar)
  if (!name || !phone || !message) {
    return res.status(400).json({
      ok: false,
      error: "Faltan campos: name, phone, message",
    });
  }

  // Aquí normalmente guardarías en DB (MySQL/Mongo/Postgres) o enviarías a WhatsApp/CRM.
  // Por ahora, solo lo “aceptamos” y respondemos.
  return res.json({
    ok: true,
    received: { name, phone, message },
    next_step:
      "Luego conectamos base de datos o mandamos a WhatsApp/Google Sheets/CRM.",
  });
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Server listo en puerto ${PORT}`);
});
