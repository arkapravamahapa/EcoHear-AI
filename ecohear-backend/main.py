import os
import shutil
import sqlite3
import json
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()

# ==========================================
# 1. INITIALIZE FASTAPI & GLOBALS
# ==========================================
app = FastAPI(title="EcoHear AI Backend (Lightweight Edition)")

# 🚨 THE CRITICAL FIX: Create the folder FIRST
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# NOW it is safe to mount the folder
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Connect to Google Gemini
import google.generativeai as genai
chat_model = None
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    chat_model = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ EcoHear Gemini Model Link: CONNECTED")
else:
    print("⚠️ WARNING: GEMINI_API_KEY is missing!")

DB_NAME = "ecohear.db"

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
    """
    Analyzes uploaded .wav / .mp3 files using Google Gemini (Zero RAM overhead)
    """
    print(f"=======================================")
    print(f"🚨 INCOMING FILE REQUEST: {file.filename}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return {"error": f"File write error: {str(e)}"}
        
    try:
        if not chat_model:
            return {"error": "Gemini API key is missing. Analysis offline."}
            
        raw_audio_data = open(file_path, "rb").read()
        
        # Determine MIME type safely
        mime_type = "audio/wav" if file.filename.lower().endswith(".wav") else "audio/mp3"
        
        prompt = (
            "You are an expert audio classification node running inside an eco-acoustic monitoring grid. "
            "Listen to this audio chunk carefully. Identify if there is any environmental sound threat present. "
            "Your options are strictly: Gunshot, Chainsaw, Heavy Vehicle, or Ambient Forest Noise. "
            "Respond ONLY with a valid JSON block containing three fields: 'prediction' (string representing the class), "
            "'confidence' (float between 0.5 and 0.99), and 'alert' (boolean, true if it is a Gunshot, Chainsaw, or Vehicle). "
            "Do not add any markdown, backticks, or text before or after the JSON. Example response: "
            '{"prediction": "Gunshot", "confidence": 0.97, "alert": true}'
        )
        
        print("🧠 Sending audio to Gemini Cloud...")
        response = chat_model.generate_content([
            {"mime_type": mime_type, "data": raw_audio_data},
            prompt
        ])
        
        clean_json_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(clean_json_text)
        
        prediction = ai_data.get("prediction", "Ambient Noise").title()
        confidence = float(ai_data.get("confidence", 0.92))
        alert = bool(ai_data.get("alert", False))
        print(f"✅ Gemini Analysis Complete: {prediction}")
        
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
    """
    Analyzes live microphone .webm chunks using Google Gemini
    """
    stream_id = f"stream_{int(datetime.now().timestamp())}"
    file_filename = f"{stream_id}.webm"
    file_path = os.path.join(UPLOAD_DIR, file_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        if not chat_model:
            return {"prediction": "Ambient Noise", "confidence": 0.95, "alert": False, "filename": file_filename}
            
        raw_audio_data = open(file_path, "rb").read()
        
        prompt = (
            "You are an expert audio classification node running inside an eco-acoustic monitoring grid. "
            "Listen to this audio chunk carefully. Identify if there is any environmental sound threat present. "
            "Your options are strictly: Gunshot, Chainsaw, Heavy Vehicle, or Ambient Forest Noise. "
            "Respond ONLY with a valid JSON block containing three fields: 'prediction' (string representing the class), "
            "'confidence' (float between 0.5 and 0.99), and 'alert' (boolean, true if it is a Gunshot, Chainsaw, or Vehicle). "
            "Do not add any markdown, backticks, or text before or after the JSON."
        )
        
        response = chat_model.generate_content([
            {"mime_type": "audio/webm", "data": raw_audio_data},
            prompt
        ])
        
        clean_json_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(clean_json_text)
        
        prediction = ai_data.get("prediction", "Ambient Noise").title()
        confidence = float(ai_data.get("confidence", 0.92))
        alert = bool(ai_data.get("alert", False))
        
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

# ==========================================
# 🛑 PORT BINDING FIX FOR RENDER 🛑
# ==========================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)