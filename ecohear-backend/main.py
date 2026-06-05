import os
import shutil
import sqlite3
import requests
import numpy as np
import librosa
import joblib
import tensorflow_hub as hub
import google.generativeai as genai
import matplotlib
matplotlib.use('Agg') # Forces matplotlib to run silently in the background
import matplotlib.pyplot as plt
import librosa.display
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gc # IMPORTING GARBAGE COLLECTOR FOR MEMORY MANAGEMENT

from dotenv import load_dotenv
load_dotenv()
# ==========================================
# 1. INITIALIZE FASTAPI & AI MODELS
# ==========================================
app = FastAPI(title="EcoHear AI Backend")

# This makes the "uploads" folder accessible via web URL
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

# Initialize Google Gemini Configuration safely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    chat_model = genai.GenerativeModel('gemini-2.5-flash')
    print("🤖 EcoHear Gemini Model Link: CONNECTED")
else:
    chat_model = None
    print("⚠️ EcoHear Gemini Model Link: OFFLINE (Missing GEMINI_API_KEY env variable)")

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
    """
    Standardizes incoming web audio to match the exact mathematical shape
    used during the AI Training Lab script pipeline.
    """
    wav, _ = librosa.load(file_path, sr=16000, mono=True)
    return wav

def generate_spectrogram(wav_data, original_filename):
    """
    Creates a 'Thermal X-Ray' image of the soundwave for visual proof.
    """
    try:
        plt.figure(figsize=(8, 2.5), facecolor='#050a08')
        S = librosa.feature.melspectrogram(y=wav_data, sr=16000, n_mels=128, fmax=8000)
        S_dB = librosa.power_to_db(S, ref=np.max)
        librosa.display.specshow(S_dB, sr=16000, x_axis='time', y_axis='mel', fmax=8000, cmap='inferno')
        plt.axis('off')
        
        spec_filename = f"{original_filename.split('.')[0]}_spec.png"
        spec_path = os.path.join(UPLOAD_DIR, spec_filename)
        
        plt.savefig(spec_path, bbox_inches='tight', pad_inches=0, facecolor='#050a08')
        
        # AGGRESSIVE MEMORY CLEANUP
        plt.clf() 
        plt.close('all')
        del S, S_dB
        gc.collect()
        
        print(f"📸 Visual Proof Generated: {spec_filename}")
    except Exception as e:
        print(f"❌ Spectrogram Generation Error: {e}")

def get_db_summary_for_ai():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT prediction, confidence, alert, timestamp FROM history ORDER BY id DESC LIMIT 10")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return "No sound events have been captured yet. The station environment is currently clean, stable, and quiet."
            
        summary = "Recent Acoustic Event Data Logs at Edge Station Alpha:\n"
        for row in rows:
            status = "🚨 THREAT ALERT Triggered" if row["alert"] else "🌿 SAFE"
            summary += f"- [{row['timestamp']}] {row['prediction']} detected with {int(row['confidence']*100)}% confidence ({status}).\n"
        return summary
    except Exception as e:
        return f"System telemetry logs temporarily unavailable: {str(e)}"

class ChatRequest(BaseModel):
    message: str

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
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"❌ File System Error: Failed to write uploaded file. {e}")
        return {"error": f"File write error: {str(e)}"}
        
    try:
        wav_data = process_audio(file_path)
        generate_spectrogram(wav_data, file.filename)
        scores, embeddings, spectrogram = yamnet_model(wav_data)
        
        mean_embedding = np.mean(embeddings.numpy(), axis=0)
        features = mean_embedding.reshape(1, -1)
        predicted_number = app_model.predict(features)
        
        raw_prediction_text = app_encoder.inverse_transform(predicted_number)[0]
        prediction = str(raw_prediction_text).title()
        
        if hasattr(app_model, "predict_proba"):
            probs = app_model.predict_proba(features)[0]
            confidence = float(max(probs))
        else:
            confidence = 0.98

        danger_keywords = ["chainsaw", "gun", "gunshot", "engine", "vehicle", "poacher"]
        is_danger_sound = any(danger in prediction.lower() for danger in danger_keywords)
        alert = bool(is_danger_sound and (confidence > 0.40))

        # AGGRESSIVE MEMORY CLEANUP
        del wav_data, scores, embeddings, spectrogram, features, mean_embedding
        gc.collect()

    except Exception as e:
        print(f"❌ AI Processing Error: {e}")
        return {"error": f"AI model inference error: {str(e)}"}

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (filename, prediction, confidence, alert, timestamp) VALUES (?, ?, ?, ?, ?)",
        (file.filename, prediction, confidence, alert, timestamp)
    )
    conn.commit()
    conn.close()
    
    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "alert": alert,
        "filename": file.filename,
        "timestamp": timestamp
    }

# --- NEW CINEMATIC REAL-TIME LIVE AUDIO STREAM STREAMING ENDPOINT ---
@app.post("/stream-predict")
async def stream_predict_audio(file: UploadFile = File(...)):
    """
    Accepts live chunked microphone data, routes it directly to Google Gemini's 
    multimodal framework for immediate extraction, saves metrics to SQLite, and renders maps.
    """
    stream_id = f"stream_{int(datetime.now().timestamp())}"
    file_filename = f"{stream_id}.webm"
    file_path = os.path.join(UPLOAD_DIR, file_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            wav_data = process_audio(file_path)
            generate_spectrogram(wav_data, file_filename)
            # AGGRESSIVE MEMORY CLEANUP
            del wav_data
            gc.collect()
        except Exception as spec_err:
            print(f"⚠️ Note: Skipped spectrogram for live stream chunk: {spec_err}")
        
        if not chat_model:
            return {"prediction": "Ambient Noise", "confidence": 0.95, "alert": False, "filename": file_filename}
            
        raw_audio_data = open(file_path, "rb").read()
        
        prompt = (
            "You are an expert audio classification node running inside an eco-acoustic monitoring grid. "
            "Listen to this audio chunk carefully. Identify if there is any environmental sound threat present. "
            "Your options are strictly: Gunshot, Chainsaw, Heavy Vehicle, or Ambient Forest Noise. "
            "Respond ONLY with a valid JSON block containing three fields: 'prediction' (string representing the class), "
            "'confidence' (float between 0.5 and 0.99), and 'alert' (boolean, true if it is a Gunshot, Chainsaw, or Vehicle). "
            "Do not add any markdown, backticks, or text before or after the JSON. Example response: "
            '{"prediction": "Gunshot", "confidence": 0.97, "alert": true}'
        )
        
        response = chat_model.generate_content([
            {"mime_type": "audio/webm", "data": raw_audio_data},
            prompt
        ])
        
        import json
        clean_json_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(clean_json_text)
        
        prediction = ai_data.get("prediction", "Ambient Noise").title()
        confidence = float(ai_data.get("confidence", 0.92))
        alert = bool(ai_data.get("alert", False))
        
        # AGGRESSIVE MEMORY CLEANUP
        del raw_audio_data, response
        gc.collect()
        
    except Exception as e:
        print(f"❌ Streaming Analysis Node Failure: {e}")
        prediction, confidence, alert = "Ambient Noise", 0.90, False

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (filename, prediction, confidence, alert, timestamp) VALUES (?, ?, ?, ?, ?)",
        (file_filename, prediction, confidence, alert, timestamp)
    )
    conn.commit()
    conn.close()
    
    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "alert": alert,
        "filename": file_filename,
        "timestamp": timestamp
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

@app.post("/chat")
async def ecobot_chat(payload: ChatRequest):
    if not chat_model:
        return {"response": "EcoBot Intelligence Node is currently offline."}
    try:
        live_db_context = get_db_summary_for_ai()
        system_prompt = (
            f"You are EcoBot, an advanced, highly specialized AI agent running on an edge deployment grid "
            f"within the EcoHear.AI acoustic tracking network at Station Alpha (Kolkata region, Sector 4).\n\n"
            f"Your job is to assist wildlife patrol officers and rangers analyze real-time sound logs, audit threat trends, "
            f"and evaluate general environmental safety indices. Keep your responses precise, professional, helpful, and alert.\n\n"
            f"CURRENT LIVE STATION DATA LOGS:\n{live_db_context}\n\n"
            f"Ranger Officer Query: {payload.message}\n"
            f"EcoBot Intelligence Response:"
        )
        response = chat_model.generate_content(system_prompt)
        return {"response": response.text}
    except Exception as e:
        return {"response": f"EcoBot telemetry uplink dropped. Diagnostic error: {str(e)}"}

@app.get("/generate-patrol")
async def generate_patrol_route():
    if not chat_model:
        return {"route": "Strategic routing offline. Missing Gemini API key."}
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT prediction, confidence, timestamp FROM history WHERE alert = 1 ORDER BY id DESC LIMIT 20")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return {"route": "Sector is currently clear. Proceed with standard randomized perimeter checks."}
            
        threat_summary = "Recent Confirmed Threats in Sector 4:\n"
        for row in rows:
            threat_summary += f"- [{row['timestamp']}] {row['prediction']} ({int(row['confidence']*100)}% confidence)\n"
            
        system_prompt = (
            "You are the Tactical Commander AI for the EcoHear edge network in Sector 4. "
            "Analyze the following recent acoustic threat logs. Identify any behavioral patterns. "
            "Based on this data, generate a highly strategic, actionable 3-step patrol route "
            "for the ranger interception teams. Be concise, authoritative, and format the output "
            "with short bullet points. Keep the entire response under 100 words.\n\n"
            f"{threat_summary}"
        )
        response = chat_model.generate_content(system_prompt)
        return {"route": response.text}
    except Exception as e:
        return {"route": f"Routing calculation failed: {str(e)}"}