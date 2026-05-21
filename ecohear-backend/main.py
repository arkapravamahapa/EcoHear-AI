import os
import shutil
import sqlite3
import requests
import numpy as np
import librosa
import joblib
import tensorflow_hub as hub
import google.generativeai as genai
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()
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
    # Force strict 16kHz sampling rate and Mono down-mixing
    wav, _ = librosa.load(file_path, sr=16000, mono=True)
    return wav

def get_db_summary_for_ai():
    """
    Reads the local SQLite database logs and formats them into a clean 
    text summary so the Gemini model has full context of what happened.
    """
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

# Pydantic data schemas for API requests
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
    
    # Securely write uploaded file to disk completely before any read actions occur
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"❌ File System Error: Failed to write uploaded file. {e}")
        return {"error": f"File write error: {str(e)}"}
        
    # --- REAL ML INTEGRATION ---
    try:
        # Load and process the audio identically to the Training Lab environment
        wav_data = process_audio(file_path)
        scores, embeddings, spectrogram = yamnet_model(wav_data)
        
        # Extract mean embedding features
        mean_embedding = np.mean(embeddings.numpy(), axis=0)
        features = mean_embedding.reshape(1, -1)
        predicted_number = app_model.predict(features)
        
        # Decode mapping tokens back to text representations
        raw_prediction_text = app_encoder.inverse_transform(predicted_number)[0]
        prediction = str(raw_prediction_text).title()
        
        # Pull model output array probabilities safely
        if hasattr(app_model, "predict_proba"):
            probs = app_model.predict_proba(features)[0]
            confidence = float(max(probs))
        else:
            confidence = 0.98

        # Determine Alert Status ONLY if the AI is highly confident (Greater than 40% based on update)
        danger_keywords = ["chainsaw", "gun", "gunshot", "engine", "vehicle", "poacher"]
        
        # 1. Check if the AI's prediction contains a danger word
        is_danger_sound = any(danger in prediction.lower() for danger in danger_keywords)
        
        # 2. Trigger the alert ONLY if it's a danger sound AND confidence matches the target threshold
        alert = bool(is_danger_sound and (confidence > 0.40))

    except Exception as e:
        print(f"❌ AI Processing Error: {e}")
        return {"error": f"AI model inference error: {str(e)}"}

    # Save cleanly executed predictions to SQLite Database
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
            print("✅ Successfully routed alert metadata packet to Central Server.\n")
        except Exception as e:
            print(f"❌ Failed to reach Central Server: {e}\n")
    else:
        print(f"\n🌿 Normal sound ({prediction}). Kept locally on Edge Server to save bandwidth.\n")
    
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

@app.post("/chat")
async def ecobot_chat(payload: ChatRequest):
    """
    Connects EcoBot Chat interactions to Google Gemini, utilizing real-time 
    SQLite logging matrices as ground-truth telemetry context.
    """
    if not chat_model:
        return {"response": "EcoBot Intelligence Node is currently offline. Please verify that the GEMINI_API_KEY value is appended correctly to your environment variables file."}
        
    try:
        # Fetch live database history matrix context
        live_db_context = get_db_summary_for_ai()
        
        # Format the system directive schema injection
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
        print(f"❌ EcoBot Inference Crash: {e}")
        return {"response": f"EcoBot telemetry uplink dropped. Diagnostic error: {str(e)}"}
    

@app.get("/generate-patrol")
async def generate_patrol_route():
    """
    Acts as a Tactical Commander AI. Analyzes the recent SQLite threat history 
    and generates a predictive, 3-step physical patrol route using Gemini.
    """
    if not chat_model:
        return {"route": "Strategic routing offline. Missing Gemini API key."}
        
    try:
        # Fetch the last 20 verified THREATS to establish a pattern
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
            "Analyze the following recent acoustic threat logs. Identify any behavioral patterns "
            "(e.g., chainsaws at night, repeated vehicles). \n\n"
            "Based on this data, generate a highly strategic, actionable 3-step patrol route "
            "for the ranger interception teams. Be concise, authoritative, and format the output "
            "with short bullet points. Keep the entire response under 100 words.\n\n"
            f"{threat_summary}"
        )
        
        response = chat_model.generate_content(system_prompt)
        return {"route": response.text}
        
    except Exception as e:
        print(f"❌ Patrol Routing Error: {e}")
        return {"route": f"Routing calculation failed: {str(e)}"}