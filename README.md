# leadflow-backend

Backend Express para capturar leads y guardarlos en Google Sheets.

## Endpoints
- GET / -> status
- GET /health -> health
- GET /api -> info
- POST /api/leads -> guarda lead en Google Sheets

## Env Vars (Render)
- GOOGLE_SHEETS_ID
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_PRIVATE_KEY
- (opcional) GOOGLE_SHEETS_TAB (default "Leads")
