import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictAudio = async (audioFile) => {
  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    const response = await api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error("API Error during prediction:", error);
    throw error;
  }
};

export const getDetectionHistory = async () => {
  try {
    const response = await api.get('/history');
    return response.data;
  } catch (error) {
    console.error("API Error during history fetch:", error);
    throw error;
  }
};

export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/chat', { message });
    return response.data;
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error;
  }
};

export default api;