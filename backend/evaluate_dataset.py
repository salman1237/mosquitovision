import os
import random
from tqdm import tqdm
from PIL import Image
from rembg import remove
from ultralytics import YOLO

DATASET_DIR = r"C:\Users\salman\Desktop\Research_Project\Mosquito_dataset"
MODEL_PATH = "best.pt"

# Load model
print("Loading model...")
model = YOLO(MODEL_PATH)

results = {
    "AEDES": {"correct": 0, "total": 0, "missed": 0, "wrong": 0},
    "ANOPHELES": {"correct": 0, "total": 0, "missed": 0, "wrong": 0},
    "CULEX": {"correct": 0, "total": 0, "missed": 0, "wrong": 0}
}

for class_name in results.keys():
    folder_path = os.path.join(DATASET_DIR, class_name)
    if not os.path.exists(folder_path):
        continue
    
    files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    random.shuffle(files)
    sample_files = files
    
    print(f"\nEvaluating {len(sample_files)} random images for {class_name}...")
    
    for idx, file in enumerate(sample_files, 1):
        img_path = os.path.join(folder_path, file)
        try:
            raw_img = Image.open(img_path)
            # YOLO Model (No background removal needed with the new model!)
            preds = model(raw_img, verbose=False, conf=0.25)
            
            results[class_name]["total"] += 1
            
            # Check detections
            if len(preds[0].boxes) == 0:
                results[class_name]["missed"] += 1
                print(f"  [{idx}/{len(sample_files)}] {file} -> [MISSED] No mosquito detected")
            else:
                # Get the class of the highest confidence detection
                boxes = preds[0].boxes
                best_box = max(boxes, key=lambda b: b.conf[0].item())
                pred_class_id = int(best_box.cls[0].item())
                pred_class_name = preds[0].names[pred_class_id].upper()
                
                if class_name in pred_class_name:
                    results[class_name]["correct"] += 1
                    print(f"  [{idx}/{len(sample_files)}] {file} -> [CORRECT] Predicted {pred_class_name}")
                else:
                    results[class_name]["wrong"] += 1
                    print(f"  [{idx}/{len(sample_files)}] {file} -> [WRONG] Predicted {pred_class_name}")
                    
        except Exception as e:
            print(f"  [{idx}/{len(sample_files)}] Error processing {img_path}: {e}")

print("\n==================================")
print("       EVALUATION RESULTS")
print("==================================")
total_correct = 0
total_images = 0

for class_name, stats in results.items():
    if stats["total"] == 0:
        continue
    
    acc = (stats["correct"] / stats["total"]) * 100
    print(f"{class_name}: {acc:.1f}% Accuracy")
    print(f"  - Correct: {stats['correct']}")
    print(f"  - Misclassified: {stats['wrong']}")
    print(f"  - No mosquito detected: {stats['missed']}")
    print("----------------------------------")
    total_correct += stats["correct"]
    total_images += stats["total"]

if total_images > 0:
    overall_acc = (total_correct / total_images) * 100
    print(f"\nOVERALL ACCURACY: {overall_acc:.1f}% ({total_correct}/{total_images})")
