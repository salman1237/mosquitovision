from __future__ import annotations
import numpy as np
import torch
from PIL import Image

# EigenCAM is the recommended CAM variant for object detection models.
# Unlike GradCAM (which needs a scalar output to differentiate),
# EigenCAM uses the principal component of the feature maps directly —
# no gradient computation needed, making it stable with YOLO's multi-output head.

TARGET_SIZE = (640, 640)


def generate_gradcam(yolo_model, image_pil: Image.Image) -> Image.Image | None:
    try:
        from pytorch_grad_cam import EigenCAM
        from pytorch_grad_cam.utils.image import show_cam_on_image

        img_rgb = image_pil.convert('RGB').resize(TARGET_SIZE)
        img_np = np.array(img_rgb, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(img_np.transpose(2, 0, 1)).unsqueeze(0)

        # Last feature extraction layer before the Detect head
        target_layers = [yolo_model.model.model[-2]]

        with EigenCAM(model=yolo_model.model, target_layers=target_layers) as cam:
            grayscale_cam = cam(input_tensor=tensor)[0]

        overlay = show_cam_on_image(img_np, grayscale_cam, use_rgb=True)
        return Image.fromarray(overlay)

    except Exception as e:
        print(f"[GradCAM] Skipped: {e}")
        return None
