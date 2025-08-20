// app/lib/api.js
import axios from 'axios';

// Use relative base URL so browser requests go through Nginx (8080) -> backend (5001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/';
export const apiClient = axios.create({ baseURL: API_URL });

// --- Main App Functions ---
export async function uploadDocumentCollection(files, collectionName, persona, jobToBeDone) {
  const formData = new FormData();
  formData.append('collectionName', collectionName);
  formData.append('personaRole', persona);
  formData.append('jobTask', jobToBeDone);
  files.forEach(function(file) { formData.append('pdfs', file); });

  const response = await apiClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.analysisData;
}

export async function getInsights(text_content) {
  const response = await apiClient.post('/api/insights', { text_content });
  return response.data;
}

export async function getHistory() {
  const res = await apiClient.get('/api/history');
  return res.data;
}

export async function getLatestOutput() {
  const res = await apiClient.get('/api/output');
  return res.data;
}

// Related content based on selected text
export async function getRelated(text, topK = 8) {
  const res = await apiClient.post('/api/related', { text, top_k: topK });
  return res.data;
}