FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Step 1: install CPU-only PyTorch FIRST, from PyTorch's CPU index.
# Installing torch via plain `pip install ultralytics` pulls the CUDA build,
# which drags in ~2.5 GB of nvidia-* wheels that are useless on a CPU VPS.
# Doing this first means ultralytics sees torch already satisfied.
RUN pip install --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .

# Step 2: install everything else (ultralytics pulls in opencv-python GUI version)
RUN pip install --no-cache-dir -r requirements.txt

# Step 3: swap GUI opencv -> headless; --force-reinstall ensures cv2 files are
# actually written even if pip thinks headless is already recorded as installed
RUN pip uninstall -y opencv-python opencv-python-headless 2>/dev/null; \
    pip install --no-cache-dir --force-reinstall opencv-python-headless

COPY . .

# Keep torch from spawning a thread per core and thrashing a 2-vCPU box.
ENV OMP_NUM_THREADS=2 \
    MKL_NUM_THREADS=2 \
    YOLO_CONFIG_DIR=/tmp/Ultralytics \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# IMPORTANT: single worker only. Each uvicorn worker loads its own copy of the
# YOLO model (~1 GB resident), so --workers 2 would roughly double memory use
# and OOM this box.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
