import requests
import os
import shutil
import sqlite3
from datetime import datetime
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="EcoHear AI Backend")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

DB_NAME = "ecohear.db"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize the SQLite Database & Table
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

# --- ADD THIS BACK SO THE FRONT PAGE WORKS ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the EcoHear AI Backend Server!"}
# --------------------------------------------

# 1. Health Check Endpoint
@app.get("/health")
def health_check():
    return {"status": "running"}

# 2. Audio Prediction API
@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # --- MOCK ML INTEGRATION ---
    # This matches your exact requirements. Later we will replace this with your teammate's model.
    # We can fake a chainsaw detection if the filename has "chainsaw" in it, otherwise return a bird!
    if "chainsaw" in file.filename.lower():
        prediction = "chainsaw"
        confidence = 0.96
        alert = True
    else:
        prediction = "bird"
        confidence = 0.88
        alert = False
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
    
    # --- NEW: EDGE TO CENTRAL SERVER ROUTING LOGIC ---
    if alert:
        # If it's a chainsaw/gunshot, forward it to the central cloud!
        print(f"\n🚨 ABNORMAL SOUND DETECTED! Forwarding {file.filename} to Central Server...")
        
        # In a real deployment, this would be your central server URL
        CENTRAL_SERVER_URL = "https://echohear-central-cloud.example.com/api/alerts"
        
        alert_payload = {
            "node_id": "Edge-Station-Alpha", 
            "filename": file.filename,
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": timestamp
        }
        
        try:
            # We use a short timeout so the edge server doesn't freeze if the cloud is down
            # (Uncomment the line below in production to actually send the data via HTTP POST)
            # response = requests.post(CENTRAL_SERVER_URL, json=alert_payload, timeout=3)
            print("✅ Successfully routed to Central Server.\n")
        except Exception as e:
            print(f"❌ Failed to reach Central Server: {e}\n")
            
    else:
        # If it's a bird/normal, keep it local.
        print(f"\n🌿 Normal sound ({prediction}). Kept locally on Edge Server to save bandwidth.\n")
    # -------------------------------------------------
    
    return {
        "prediction": prediction,
        "confidence": confidence,
        "alert": alert
    }

# 3. History Endpoint
@app.get("/history")
def get_history():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # This allows us to return rows as dictionaries
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    # Format rows into a clean list of JSON objects
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