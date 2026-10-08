# AI Job Application Tracker

Full-stack application featuring a React + Vite frontend and a Flask backend with AI resume matching.

## Directory Structure

```
├── Frontend/           # React 19 + Vite + Bootstrap application
│   ├── src/
│   ├── package.json
│   └── ...
└── Backend/            # Flask REST API + SQLite database + AI service
    ├── venv/           # Python virtual environment
    ├── app.py
    ├── models.py
    ├── ai_service.py
    ├── requirements.txt
    └── instance/
```

## Running the Application

### 1. Backend

Navigate to `Backend` and activate the virtual environment:

```powershell
cd Backend
.\venv\Scripts\Activate.ps1
python app.py
```

The Flask API will start on `http://localhost:5000`.

> **Note**: Add your Gemini API key in `Backend/.env` (`GEMINI_API_KEY=...`) to enable the ATS resume matching feature.

### 2. Frontend

Navigate to `Frontend` and start the Vite dev server:

```powershell
cd Frontend
npm run dev
```

The UI will be accessible at `http://localhost:5173`.

## Security Architecture

- **Cryptographic JWT Tokens**: Signed using HMAC-SHA256 (`HS256`) with a strong 256-bit secret key.
- **HttpOnly Cookies**: Authentication tokens are transmitted exclusively via `Set-Cookie` with `HttpOnly; SameSite=Lax; Path=/`.
- **Zero DevTools Storage Exposure**: Neither `localStorage` nor `sessionStorage` stores tokens or credentials. Client-side JavaScript cannot access the token via `document.cookie` or DevTools console, mitigating token exfiltration via XSS.
- **IDOR Protection**: All resource operations (applications, resumes, notes) are strictly scoped and verified against the authenticated user in the JWT payload on the backend.
