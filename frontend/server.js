import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Multer for handling audio file uploads (stores them temporarily in memory)
const upload = multer({ storage: multer.memoryStorage() });

// In-memory array to store our detection history for the /history route
let detectionLogs = [
  { prediction: 'Asian Elephant', confidence: 0.94, alert: false, timestamp: '13:05 PM' },
  { prediction: 'Chainsaw (Sector 2)', confidence: 0.99, alert: true, timestamp: '12:42 PM' },
];

/**
 * POST /predict 
 * Accepts an audio file, simulates an AI model delay, and returns a classification.
 */
app.post('/predict', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  // Simulate AI processing time (1.5 seconds)
  setTimeout(() => {
    // Array of possible mock outcomes to randomize the demo experience
    const mockOutcomes = [
      { prediction: 'Chainsaw', confidence: 0.98, alert: true },
      { prediction: 'Tiger Roar', confidence: 0.92, alert: false },
      { prediction: 'Gunshot', confidence: 0.89, alert: true },
      { prediction: 'Heavy Rainfall', confidence: 0.95, alert: false },
      { prediction: 'Crested Serpent Eagle', confidence: 0.85, alert: false },
    ];

    // Pick a random outcome for the demo
    const result = mockOutcomes[Math.floor(Math.random() * mockOutcomes.length)];
    
    // Add a timestamp
    const responseData = {
      ...result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Save to our history log (add to the front of the array)
    detectionLogs.unshift(responseData);

    // Keep history array from getting too long for the demo
    if (detectionLogs.length > 20) detectionLogs.pop();

    res.json(responseData);
  }, 1500); 
});

/**
 * GET /history
 * Returns the recent log of detections to populate the frontend table.
 */
app.get('/history', (req, res) => {
  res.json(detectionLogs);
});

// Start the server
app.listen(port, () => {
  console.log(`🌲 EcoHear Backend API is running on http://localhost:${port}`);
});