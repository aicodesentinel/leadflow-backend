const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

// =====================
// CONFIG GENERAL
// =====================
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 10000;

// =====================
// GOOGLE SHEETS (SERVICE ACCOUNT)
// =====================
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  // Render suele guardar los saltos como \n (texto); hay que convertirlos a saltos reales
  if (key) key = key.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Faltan env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

async function appendLead({ name, phone, message, source = "web" }) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const sheetTab = process.env.GOOGLE_SHEETS_TAB || "Leads";

  if (!spreadsheetId) throw new Error("Falta env var: GOOGLE_SHEETS_ID");

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const now = new Date().toISOString();

  // Columnas: fecha | nombre | telefono | mensaje | fuente
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetTab}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[now, name, phone, message, source]]
    }
  });
}

// =====================
// RUTAS BASE (para que NO salga Not Found)
// =====================
app.get("/", (req, res) => {
  res.status(200).send("✅ leadflow-backend online. Try /health or /api");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.get("/api", (req, res) => {
  res.json({
    message: "API running",
    endpoints: {
      GET: ["/", "/health", "/api"],
      POST: ["/api/leads"]
    }
  });
});

// =====================
// ENDPOINT PRINCIPAL: LEADS
// =====================
app.post("/api/leads", async (req, res) => {
  try {
    const { name, phone, message, source } = req.body || {};

    // Validación mínima (evita basura)
    if (!name || !phone || !message) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos: name, phone, message"
      });
    }

    // Limpieza simple
    const safeName = String(name).trim().slice(0, 80);
    const safePhone = String(phone).trim().slice(0, 30);
    const safeMessage = String(message).trim().slice(0, 1000);
    const safeSource = source ? String(source).trim().slice(0, 50) : "web";

    await appendLead({
      name: safeName,
      phone: safePhone,
      message: safeMessage,
      source: safeSource
    });

    return res.json({ ok: true, saved: true });
  } catch (err) {
    console.error("ERROR /api/leads:", err);
    return res.status(500).json({
      ok: false,
      error: "No se pudo guardar el lead",
      detail: err.message
    });
  }
});

// =====================
// START
// =====================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
