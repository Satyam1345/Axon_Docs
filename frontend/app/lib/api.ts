// app/lib/api.ts
import axios from 'axios';
import { AnalysisData } from '@/app/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
export const apiClient = axios.create({ baseURL: API_URL });

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete apiClient.defaults.headers.common['x-auth-token'];
  }
};

// --- Auth Functions ---
export const registerUser = async (formData: any) => {
    const res = await apiClient.post('/api/auth/register', formData);
    return res.data;
};

export const loginUser = async (formData: any) => {
    const res = await apiClient.post('/api/auth/login', formData);
    return res.data;
};

// --- Main App Functions ---
export const uploadDocumentCollection = async (
  files: File[],
  collectionName: string,
  persona: string,
  jobToBeDone: string
): Promise<AnalysisData> => {
  const formData = new FormData();
  formData.append('collectionName', collectionName);
  formData.append('personaRole', persona);
  formData.append('jobTask', jobToBeDone);
  files.forEach(file => formData.append('pdfs', file));

  const response = await apiClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.analysisData;
};

export const getInsights = async (text_content: string) => {
    const response = await apiClient.post('/api/insights', { text_content });
    return response.data;
};

export const getHistory = async (): Promise<any[]> => {
    const res = await apiClient.get('/api/history');
    return res.data;
};
