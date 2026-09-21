"""
Generate thumbnails for the sample image library served by /api/samples.

Walks SAMPLES_DIR (default /app/samples), and for every image found writes a
200 px JPEG thumbnail to SAMPLES_DIR/.thumbs/<same relative path>. Existing
thumbnails are skipped, so re-running after adding images is cheap.

Run inside the backend image so Pillow is available, e.g.:
  docker run --rm -v /srv/mosquitovision/samples:/app/samples \
      mosquito-backend:latest python make_thumbs.py
"""
import os
import sys
from pathlib import Path
from PIL import Image

SAMPLES_DIR = Path(os.environ.get("SAMPLES_DIR", "/app/samples"))
THUMBS_DIR = SAMPLES_DIR / ".thumbs"
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
SIZE = 200

if not SAMPLES_DIR.is_dir():
    sys.exit(f"{SAMPLES_DIR} does not exist")

made = skipped = failed = 0
for src in SAMPLES_DIR.rglob("*"):
    if src.suffix.lower() not in IMAGE_EXTS or THUMBS_DIR in src.parents:
        continue
    dst = THUMBS_DIR / src.relative_to(SAMPLES_DIR)
    if dst.exists():
        skipped += 1
        continue
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(src) as im:
            im = im.convert("RGB")
            im.thumbnail((SIZE, SIZE))
            im.save(dst, "JPEG", quality=80, optimize=True)
        made += 1
    except Exception as e:  # keep going; one bad file shouldn't stop the batch
        failed += 1
        print(f"FAILED {src}: {e}")

print(f"thumbnails: {made} created, {skipped} already existed, {failed} failed")
