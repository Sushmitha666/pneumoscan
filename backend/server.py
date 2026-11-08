import io, json, base64
import numpy as np, torch, torch.nn as nn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import models, transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

THRESHOLD = json.load(open("threshold.json"))["threshold"]

model = models.resnet18()
model.fc = nn.Linear(model.fc.in_features, 2)
model.load_state_dict(torch.load("best_model.pt", map_location="cpu"))
model.eval()

tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
cam = GradCAM(model=model, target_layers=[model.layer4[-1]])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    pil = Image.open(io.BytesIO(await file.read())).convert("L")
    x = tf(pil).unsqueeze(0)
    with torch.no_grad():
        p = torch.softmax(model(x), dim=1)[0, 1].item()
    g = cam(input_tensor=x, targets=[ClassifierOutputTarget(1)])[0]
    base = np.array(pil.resize((224, 224)).convert("RGB")).astype(np.float32) / 255.0
    out = show_cam_on_image(base, g, use_rgb=True)
    buf = io.BytesIO()
    Image.fromarray(out).save(buf, format="PNG")
    return {
        "label": "PNEUMONIA" if p >= THRESHOLD else "NORMAL",
        "probability": p,
        "heatmap": base64.b64encode(buf.getvalue()).decode(),
    }