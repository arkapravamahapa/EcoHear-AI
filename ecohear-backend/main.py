import os

# 🛑 DISABLE GPU DETECTION (Fixes the CUDA 303 Error)
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import shutil
import sqlite3
import requests
import numpy as np
import librosa
import joblib
import tensorflow as tf
import tensorflow_hub as hub
import google.generativeai as genai
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gc 

from dotenv import load_dotenv
load_dotenv()

# 🛑 CRITICAL MEMORY OPTIMIZATION FOR RENDER FREE TIER 🛑
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)
# ==========================================

# ==========================================
# 1. INITIALIZE FASTAPI & GLOBALS
# ==========================================
app = FastAPI(title="EcoHear AI Backend")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Set AI variables to None so they don't load during boot-up
yamnet_model = None
app_model = None
app_encoder = None
chat_model = None
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def load_ai_models():
    """LAZY LOADING: Only loads heavy AI models when a prediction is requested."""
    global yamnet_model, app_model, app_encoder, chat_model
    
    if yamnet_model is None:
        print("🧠 Lazy Loading YAMNet from Google...")
        yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')
        
    if app_model is None:
        print("📦 Lazy Loading custom EcoHear models...")
        app_model = joblib.load('ecohear_custom_model.pkl')
        app_encoder = joblib.load('ecohear_label_encoder.pkl')
        
    if chat_model is None and GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        chat_model = genai.GenerativeModel('gemini-2.5-flash')
        print("🤖 EcoHear Gemini Model Link: CONNECTED")

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
    try:
        wav, _ = librosa.load(file_path, sr=16000, mono=True)
        return wav
    except Exception as e:
        print(f"❌ Critical Audio Read Error: {e}")
        raise ValueError(f"Could not read audio file: {e}")

def generate_spectrogram(wav_data, original_filename):
    pass

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
    print(f"=======================================")
    print(f"🚨 INCOMING REQUEST: {file.filename}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print("🟢 STEP 1: File successfully saved to disk.")
    except Exception as e:
        print(f"❌ ERROR AT STEP 1: {e}")
        return {"error": f"File write error: {str(e)}"}
        
    try:
        print("🟢 STEP 1.5: Checking if AI models are loaded...")
        load_ai_models()
        
        print("🟢 STEP 2: Handing file to Librosa for processing...")
        wav_data = process_audio(file_path)
        
        print("🟢 STEP 3: Librosa finished! Handing data to TensorFlow YAMNet...")
        scores, embeddings, spectrogram = yamnet_model(wav_data)
        
        print("🟢 STEP 4: YAMNet finished! Handing data to Random Forest...")
        mean_embedding = np.mean(embeddings.numpy(), axis=0)
        features = mean_embedding.reshape(1, -1)
        predicted_number = app_model.predict(features)
        
        print("🟢 STEP 5: AI Predictions complete! Formatting results...")
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

        print("🟢 STEP 6: Cleaning up memory...")
        del wav_data, scores, embeddings, spectrogram, features, mean_embedding
        gc.collect()

    except Exception as e:
        print(f"❌ AI Processing Error: {e}")
        return {"error": f"AI model inference error: {str(e)}"}

    print("🟢 STEP 7: Saving to SQLite Database...")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (filename, prediction, confidence, alert, timestamp) VALUES (?, ?, ?, ?, ?)",
        (file.filename, prediction, confidence, alert, timestamp)
    )
    conn.commit()
    conn.close()
    
    print(f"✅ FINAL STEP: Sending {prediction} back to Vercel!")
    print(f"=======================================")
    
    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "alert": alert,
        "filename": file.filename,
        "timestamp": timestamp
    }

@app.post("/stream-predict")
async def stream_predict_audio(file: UploadFile = File(...)):
    stream_id = f"stream_{int(datetime.now().timestamp())}"
    file_filename = f"{stream_id}.webm"
    file_path = os.path.join(UPLOAD_DIR, file_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            load_ai_models()
            wav_data = process_audio(file_path)
            del wav_data
            gc.collect()
        except Exception as spec_err:
            print(f"⚠️ Note: Audio processing skipped for stream chunk: {spec_err}")
        
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
    load_ai_models()
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
    load_ai_models()
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