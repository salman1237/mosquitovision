import os
import io
import base64
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from rembg import remove
from PIL import Image

app = FastAPI(title="MosquitoVision API")

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
        results = model(raw_img, conf=0.25)
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
        
        # Convert BGR (OpenCV) to RGB (PIL) to encode
        annotated_img_rgb = cv2.cvtColor(annotated_img_bgr, cv2.COLOR_BGR2RGB)
        annotated_pil = Image.fromarray(annotated_img_rgb)
        
        # 4. Encode as Base64
        buffered = io.BytesIO()
        annotated_pil.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        alerts_list = list(triggered_alerts.values())

        return {
            "success": True,
            "alerts": alerts_list,
            "total_detected": sum(a['count'] for a in alerts_list),
            "image_base64": f"data:image/png;base64,{img_base64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
