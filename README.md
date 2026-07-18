# MosquitoVision

AI-powered mosquito species detection and disease risk analysis.

## Structure

```
mosquitovision/
├── backend/     # FastAPI + YOLO inference server
└── frontend/    # Next.js web application
```

## Backend

FastAPI server with a YOLO segmentation model that detects mosquito species and returns disease risk alerts.

**Requirements:** Python 3.11+

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at `http://localhost:8000`

**Endpoint:** `POST /api/analyze` — multipart image upload → species detections + annotated image

## Frontend

Next.js 16 app with drag-and-drop image upload, annotated results, scan history, and an analytics dashboard.

**Requirements:** Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to point at the backend (default: `http://localhost:8000`).

## Species detected

| Species | Risk | Diseases |
|---|---|---|
| *Aedes spp.* | High | Dengue, Zika, Chikungunya |
| *Anopheles spp.* | Critical | Malaria |
| *Culex spp.* | Moderate-High | West Nile, Japanese Encephalitis |
