from __future__ import annotations
import numpy as np
import torch
from PIL import Image

TARGET_SIZE = (640, 640)


def generate_gradcam(yolo_model, image_pil: Image.Image) -> Image.Image | None:
    """
    Gradient-free activation map using the C2PSA backbone layer (index 10).
    Captures the forward activation map via a hook, takes the L2 norm across
    channels, and overlays it as a heatmap — no backprop needed.
    """
    try:
        from pytorch_grad_cam.utils.image import show_cam_on_image

        img_rgb = image_pil.convert('RGB').resize(TARGET_SIZE)
        img_np = np.array(img_rgb, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(img_np.transpose(2, 0, 1)).unsqueeze(0).float()

        captured = []

        def _hook(module, inp, out):
            if isinstance(out, torch.Tensor):
                captured.append(out.detach().cpu())

        target_layer = yolo_model.model.model[10]  # C2PSA — last backbone layer
        handle = target_layer.register_forward_hook(_hook)

        try:
            with torch.no_grad():
                yolo_model.model(tensor)
        finally:
            handle.remove()

        if not captured:
            print("[GradCAM] Skipped: no activation captured")
            return None

        acts = captured[0][0]          # [C, H, W]
        # L2 norm across channels highlights regions with strong overall activations
        cam = acts.norm(dim=0).numpy()  # [H, W]

        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min < 1e-8:
            print("[GradCAM] Skipped: flat activation map")
            return None
        cam = (cam - cam_min) / (cam_max - cam_min)

        # Resize to 640×640
        cam_img = Image.fromarray((cam * 255).astype(np.uint8)).resize(
            TARGET_SIZE, Image.BILINEAR
        )
        cam_np = np.array(cam_img, dtype=np.float32) / 255.0

        overlay = show_cam_on_image(img_np, cam_np, use_rgb=True)
        return Image.fromarray(overlay)

    except Exception as e:
        print(f"[GradCAM] Skipped: {e}")
        return None
