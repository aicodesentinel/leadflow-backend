const express = require("express");
const cors = require("cors");
// =========================
// LEADS -> GOOGLE SHEETS
// =========================
const { google } = require("googleapis");

// Render env vars:
// GOOGLE_SHEETS_ID
// GOOGLE_SERVICE_ACCOUNT_EMAIL
// GOOGLE_PRIVATE_KEY

function getGoogleAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Render guarda saltos de línea como \n, hay que convertirlos
  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account env vars.");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function appendLeadToSheet({ name, phone, message }) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_ID env var.");

  const auth = getGoogleAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const now = new Date().toISOString();

  // Hoja y rango: "Leads!A:D"
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Leads!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[now, name || "", phone || "", message || ""]],
    },
  });
}

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
app.post("/api/leads", async (req, res) => {
  try {
    const { name, phone, message } = req.body || {};

    if (!name || !phone || !message) {
      return res.status(400).json({
        ok: false,
        error: "Missing fields: name, phone, message",
      });
    }

    await appendLeadToSheet({ name, phone, message });

    return res.json({ ok: true, saved: true });
  } catch (err) {
    console.error("LEAD ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to save lead",
      detail: err.message,
    });
  }
});
