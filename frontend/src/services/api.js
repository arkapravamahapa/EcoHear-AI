import axios from 'axios';

// Changed port from 5000 to 8000 to match your FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictAudio = async (audioFile) => {
  const formData = new FormData();
  // Changed field name from 'audio' to 'file' to match FastAPI backend (UploadFile = File(...))
  formData.append('file', audioFile);

  try {
    const response = await api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getDetectionHistory = async () => {
  try {
    const response = await api.get('/history');
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default api;