# DRISHTI GeoAI — frontend

This folder is the GeoAI ops UI for [SIH-26](https://github.com/rhushiiii/SIH-26). Place it at the repo root as `frontend/`, next to `backend/`.

```text
SIH-26/
  backend/          FastAPI  (/api/v1)
  frontend/         this app
```

**Pipeline:** raw image → validation → tiling → AI segmentation → GIS features → confidence → human validation → map → export.

Mock API is **on by default** so the UI is fully playable without the backend. Turn mock off in **Settings** to hit FastAPI at `http://localhost:8000/api/v1`.

## Run

Needs **Node 22+**.

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:8080`

Backend (separate terminal, from repo root):

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: `http://127.0.0.1:8000` · docs: `http://127.0.0.1:8000/docs`

If you connect the live API, FastAPI needs CORS for `http://localhost:8080`. Until then, leave mock mode on.

## Scripts

```bash
npm run typecheck
npm run build
```

## Env

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_USE_MOCK_API` | `true` | In-app mock services |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | FastAPI public API |

Same values can be changed in **Settings** (saved in the browser).

## Stack

TanStack Start · React 19 · TypeScript · Tailwind v4 · TanStack Query · Leaflet · Recharts
