import os
import io
import base64
import random
from pathlib import Path
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from PIL import Image
from gradcam import generate_gradcam

app = FastAPI(title="MosquitoVision API")

# ---------------------------------------------------------------------------
# Sample image library (for demos on machines without local test images).
# SAMPLES_DIR is a bind-mounted host folder; each entry in SAMPLE_COLLECTIONS
# maps a top-level folder to the sub-folders that hold images.
# Thumbnails live under <SAMPLES_DIR>/.thumbs/<same relative path>.
# ---------------------------------------------------------------------------
SAMPLES_DIR = Path(os.environ.get("SAMPLES_DIR", "/app/samples"))
THUMBS_DIR = SAMPLES_DIR / ".thumbs"
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
SAMPLE_COLLECTIONS = {
    "real": {
        "name": "Real photos (Kaggle source)",
        "root": "Mosquito_dataset",
        "folders": {"AEDES": "Aedes", "ANOPHELES": "Anopheles", "CULEX": "Culex"},
    },
    "synthetic": {
        "name": "Synthetic scenes (generated dataset)",
        "root": "Mosquito_YOLO_Seg_new",
        "folders": {"val/images": "Validation split", "train/images": "Training split"},
    },
}

if SAMPLES_DIR.is_dir():
    app.mount("/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")
    print(f"[INFO] Sample library mounted from {SAMPLES_DIR}")
else:
    print(f"[INFO] No sample library at {SAMPLES_DIR}; /api/samples disabled.")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your Next.js URL in production (e.g., ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
MODEL_PATH = "best.pt"
try:
    model = YOLO(MODEL_PATH)
    print("[INFO] YOLO model loaded successfully.")
except Exception as e:
    print(f"[WARNING] Could not load model from {MODEL_PATH}. Error: {e}")
    model = None

# Disease mapping
DISEASE_MAP = {
    'aedes': {
        'species': 'Aedes spp.',
        'diseases': 'Dengue, Zika, Chikungunya',
        'risk': 'High',
        'intervention': 'Urban water-clearing protocols',
        'color': '#ff4d4d'
    },
    'anopheles': {
        'species': 'Anopheles spp.',
        'diseases': 'Malaria',
        'risk': 'Critical',
        'intervention': 'ITN distribution; IRS campaigns',
        'color': '#ff1a1a'
    },
    'culex': {
        'species': 'Culex spp.',
        'diseases': 'West Nile Virus, Japanese Encephalitis',
        'risk': 'Moderate-High',
        'intervention': 'Drainage management; larviciding',
        'color': '#ff9933'
    }
}

@app.get("/")
def read_root():
    return {"message": "MosquitoVision FastAPI Backend is running."}


def _folder_path(collection: str, folder: str) -> Path:
    """Resolve a (collection, folder) pair to an on-disk directory, rejecting
    anything that is not an explicitly configured sample folder."""
    coll = SAMPLE_COLLECTIONS.get(collection)
    if not coll or folder not in coll["folders"]:
        raise HTTPException(status_code=404, detail="Unknown sample folder.")
    path = SAMPLES_DIR / coll["root"] / folder
    if not path.is_dir():
        raise HTTPException(status_code=404, detail="Sample folder not present on server.")
    return path


@app.get("/api/samples")
def list_sample_collections():
    """Top-level catalogue of sample folders and how many images each holds."""
    if not SAMPLES_DIR.is_dir():
        return {"collections": []}
    out = []
    for cid, coll in SAMPLE_COLLECTIONS.items():
        folders = []
        for fid, label in coll["folders"].items():
            p = SAMPLES_DIR / coll["root"] / fid
            if p.is_dir():
                n = sum(1 for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS)
                folders.append({"id": fid, "name": label, "count": n})
        if folders:
            out.append({"id": cid, "name": coll["name"], "folders": folders})
    return {"collections": out}


@app.get("/api/samples/{collection}/{folder:path}")
def list_sample_images(
    collection: str,
    folder: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=96),
    seed: int | None = Query(None, description="Shuffle deterministically with this seed"),
):
    """Page through the images in one sample folder. With `seed`, the folder
    is shuffled so the demo can show a different random set each time."""
    path = _folder_path(collection, folder)
    files = sorted(f.name for f in path.iterdir() if f.suffix.lower() in IMAGE_EXTS)
    if seed is not None:
        random.Random(seed).shuffle(files)
    root = SAMPLE_COLLECTIONS[collection]["root"]
    page = files[offset:offset + limit]
    items = []
    for name in page:
        rel = f"{root}/{folder}/{name}"
        thumb_rel = f".thumbs/{rel}"
        items.append({
            "name": name,
            "url": f"/samples/{rel}",
            # Fall back to the full image if no thumbnail has been generated.
            "thumb": f"/samples/{thumb_rel}" if (THUMBS_DIR / rel).exists() else f"/samples/{rel}",
        })
    return {"total": len(files), "offset": offset, "limit": limit, "items": items}

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded. Ensure best.pt is in the directory.")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        # Read uploaded image into memory
        contents = await file.read()
        raw_img = Image.open(io.BytesIO(contents))

        # 1. YOLO Inference (No background removal needed with the new model!)
        results = model(raw_img, conf=0.4)
        result = results[0]

        triggered_alerts = {}

        # Parse detections
        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                class_name = result.names[class_id].lower()
                
                for key, info in DISEASE_MAP.items():
                    if key in class_name:
                        if key in triggered_alerts:
                            triggered_alerts[key]['count'] += 1
                        else:
                            triggered_alerts[key] = {
                                'species': info['species'],
                                'diseases': info['diseases'],
                                'risk': info['risk'],
                                'intervention': info['intervention'],
                                'color': info['color'],
                                'count': 1
                            }
                        break

        # 3. Create Annotated Image
        annotated_img_bgr = result.plot()
        annotated_img_rgb = annotated_img_bgr[:, :, ::-1]  # BGR → RGB via numpy slice
        annotated_pil = Image.fromarray(annotated_img_rgb)
        
        # 4. Encode as Base64
        buffered = io.BytesIO()
        annotated_pil.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        alerts_list = list(triggered_alerts.values())

        # GradCAM heatmap — runs on the original image, fails gracefully
        gradcam_base64 = None
        if model and alerts_list:
            heatmap = generate_gradcam(model, raw_img)
            if heatmap:
                buf = io.BytesIO()
                heatmap.save(buf, format="PNG")
                gradcam_base64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "alerts": alerts_list,
            "total_detected": sum(a['count'] for a in alerts_list),
            "image_base64": f"data:image/png;base64,{img_base64}",
            "gradcam_base64": gradcam_base64,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
