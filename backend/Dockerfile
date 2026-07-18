FROM python:3.12-slim

WORKDIR /app

# Install system libraries that opencv-python (pulled by ultralytics) needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxcb1 \
    libx11-6 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install deps, then force-swap GUI opencv → headless so no X11 display is needed at runtime
RUN pip install --no-cache-dir -r requirements.txt \
    && pip uninstall -y opencv-python 2>/dev/null || true \
    && pip install --no-cache-dir opencv-python-headless

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
