FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Step 1: install everything (ultralytics pulls in opencv-python GUI version)
RUN pip install --no-cache-dir -r requirements.txt

# Step 2: swap GUI opencv → headless; --force-reinstall ensures cv2 files are actually written
# even if pip thinks opencv-python-headless is already recorded as installed
RUN pip uninstall -y opencv-python opencv-python-headless 2>/dev/null; \
    pip install --no-cache-dir --force-reinstall opencv-python-headless

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
