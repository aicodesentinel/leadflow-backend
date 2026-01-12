const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

/**
 * ✅ CORS:
 * Si quieres hacerlo más estricto luego, aquí puedes limitar orígenes.
 */
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

/**
 * ✅ ENV obligatorias (Render):
 * - SHEET_ID
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 *
 * Opcionales:
 * - SHEET_NAME (default: "Leads")
 * - ALLOWED_ORIGINS (lista separada por comas)
 */
const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "Leads";
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;

function assertEnv() {
  const missing = [];
  if (!SHEET_ID) missing.push("SHEET_ID");
  if (!SA_EMAIL) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!PRIVATE_KEY_RAW) missing.push("GOOGLE_PRIVATE_KEY");
  return missing;
}

/**
 * ✅ Render guarda la llave como texto.
 * A veces viene con \n literales. Esto lo repara.
 */
function normalizePrivateKey(key) {
  return key.replace(/\\n/g, "\n");
}

async function getSheetsClient() {
  const missing = assertEnv();
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  const auth = new google.auth.JWT({
    email: SA_EMAIL,
    key: normalizePrivateKey(PRIVATE_KEY_RAW),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  await auth.authorize();

  return google.sheets({ version: "v4", auth });
}

/**
 * ✅ Salud
 */
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.get("/api", (req, res) => {
  res.json({
    message: "API running",
    endpoints: ["/", "/health", "/api", "/api/leads (POST)"]
  });
});

app.get("/", (req, res) => {
  res.status(200).send("✅ leadflow-backend online. Try /health or /api");
});

/**
 * ✅ Helper: validación básica
 */
function clean(str) {
  if (str === undefined || str === null) return "";
  return String(str).trim();
}

function nowISO() {
  return new Date().toISOString();
}

/**
 * ✅ POST /api/leads
 * Body esperado (JSON):
 * {
 *   "name": "Eduardo",
 *   "whatsapp": "526568239431",
 *   "email": "x@x.com",
 *   "source": "landing/ig/tiktok",
 *   "message": "Quiero..."
 * }
 */
app.post("/api/leads", async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const whatsapp = clean(req.body?.whatsapp);
    const email = clean(req.body?.email);
    const source = clean(req.body?.source);
    const message = clean(req.body?.message);

    // Validación mínima (ajustable)
    if (!name) {
      return res.status(400).json({ ok: false, error: "Falta name" });
    }
    if (!whatsapp) {
      return res.status(400).json({ ok: false, error: "Falta whatsapp" });
    }
    if (!message) {
      return res.status(400).json({ ok: false, error: "Falta message" });
    }

    const sheets = await getSheetsClient();

    // ✅ Asegúrate de que la hoja existe: SHEET_NAME (default "Leads")
    // Guardamos columnas: timestamp, name, whatsapp, email, source, message, userAgent, ip
    const row = [
      nowISO(),
      name,
      whatsapp,
      email,
      source,
      message,
      clean(req.headers["user-agent"]),
      clean(req.headers["x-forwarded-for"] || req.socket?.remoteAddress)
    ];

    const range = `${SHEET_NAME}!A:H`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row]
      }
    });

    return res.json({ ok: true, saved: true });
  } catch (err) {
    const msg = err?.message || "Unknown error";
    return res.status(500).json({
      ok: false,
      error: "No se pudo guardar en Google Sheets",
      detail: msg
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
