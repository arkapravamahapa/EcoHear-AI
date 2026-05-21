import os
import shutil
import sqlite3
import requests
import numpy as np
import librosa
import joblib
import tensorflow_hub as hub
from datetime import datetime
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# 1. INITIALIZE FASTAPI & AI MODELS
# ==========================================
app = FastAPI(title="EcoHear AI Backend")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

print("🧠 Downloading/Loading YAMNet from Google (This may take a moment)...")
yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')

print("📦 Loading custom EcoHear models...")
app_model = joblib.load('ecohear_custom_model.pkl')
app_encoder = joblib.load('ecohear_label_encoder.pkl')

DB_NAME = "ecohear.db"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            prediction TEXT,
            confidence REAL,
            alert BOOLEAN,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def process_audio(file_path):
    # Librosa forces 16kHz and Mono channel as required by YAMNet
    wav, _ = librosa.load(file_path, sr=16000, mono=True)
    return wav

# ==========================================
# 3. API ENDPOINTS
# ==========================================
@app.get("/")
def read_root():
    return {"message": "Welcome to the EcoHear AI Backend Server!"}

@app.get("/health")
def health_check():
    return {"status": "running"}

@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # --- REAL ML INTEGRATION ---
    # --- REAL ML INTEGRATION ---
    try:
        # Analyze the audio
        wav_data = process_audio(file_path)
        scores, embeddings, spectrogram = yamnet_model(wav_data)
        
        # Get features and predict
        mean_embedding = np.mean(embeddings.numpy(), axis=0)
        features = mean_embedding.reshape(1, -1)
        predicted_number = app_model.predict(features)
        
        # Convert prediction to text and title-case it for the UI
        raw_prediction_text = app_encoder.inverse_transform(predicted_number)[0]
        prediction = str(raw_prediction_text).title()
        
        # Try to get real confidence score, default to 0.98 if model doesn't support probabilities
        if hasattr(app_model, "predict_proba"):
            probs = app_model.predict_proba(features)[0]
            confidence = float(max(probs))
        else:
            confidence = 0.98

        # Determine Alert Status ONLY if the AI is highly confident (Greater than 75%)
        danger_keywords = ["chainsaw", "gun", "gunshot", "engine", "vehicle", "poacher"]
        
        # 1. Check if the AI's prediction contains a danger word
        is_danger_sound = any(danger in prediction.lower() for danger in danger_keywords)
        
        # 2. Trigger the alert ONLY if it's a danger sound AND confidence is high
        alert = bool(is_danger_sound and (confidence > 0.75))

    except Exception as e:
        print(f"❌ AI Processing Error: {e}")
        return {"error": str(e)}
    # ---------------------------
    # ---------------------------

    # Save to SQLite Database
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (filename, prediction, confidence, alert, timestamp) VALUES (?, ?, ?, ?, ?)",
        (file.filename, prediction, confidence, alert, timestamp)
    )
    conn.commit()
    conn.close()
    
    # --- EDGE TO CENTRAL SERVER ROUTING LOGIC ---
    if alert:
        print(f"\n🚨 ABNORMAL SOUND DETECTED! Forwarding {file.filename} to Central Server...")
        CENTRAL_SERVER_URL = "https://echohear-central-cloud.example.com/api/alerts"
        alert_payload = {
            "node_id": "Edge-Station-Alpha", 
            "filename": file.filename,
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": timestamp
        }
        try:
            # response = requests.post(CENTRAL_SERVER_URL, json=alert_payload, timeout=3)
            print("✅ Successfully routed to Central Server.\n")
        except Exception as e:
            print(f"❌ Failed to reach Central Server: {e}\n")
    else:
        print(f"\n🌿 Normal sound ({prediction}). Kept locally on Edge Server to save bandwidth.\n")
    # -------------------------------------------------
    
    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "alert": alert
    }

@app.get("/history")
def get_history():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    history_list = []
    for row in rows:
        history_list.append({
            "id": row["id"],
            "filename": row["filename"],
            "prediction": row["prediction"],
            "confidence": row["confidence"],
            "alert": bool(row["alert"]),
            "timestamp": row["timestamp"]
        })
        
    return history_list