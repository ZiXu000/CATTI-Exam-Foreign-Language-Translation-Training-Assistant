import { GraderResponse, TranslationRequest, GenerateExamRequest, GenerateExamResponse, GenerateWrittenCompRequest, GenerateWrittenCompResponse } from '../types';

const API_BASE_URL = '/api/v1';

export const gradeTranslation = async (data: TranslationRequest): Promise<GraderResponse> => {
  const response = await fetch(`${API_BASE_URL}/grade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export const generateExam = async (data: GenerateExamRequest): Promise<GenerateExamResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate_exam`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export const generateWrittenComp = async (data: GenerateWrittenCompRequest): Promise<GenerateWrittenCompResponse> => {
  const response = await fetch(`${API_BASE_URL}/written_comp/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export const generateTTS = async (text: string, apiKey: string, voice: string = "Chloe"): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/tts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice,
      api_key: apiKey
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.audio_base64;
};

// History APIs
export const saveExamRecord = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/history/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save exam record');
  return response.json();
};

export const getExamRecords = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE_URL}/history/`);
  if (!response.ok) throw new Error('Failed to fetch exam records');
  return response.json();
};

export const deleteExamRecord = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/history/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete exam record');
};

export const toggleFavorite = async (id: number, is_favorite: boolean): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/history/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_favorite }),
  });
  if (!response.ok) throw new Error('Failed to update favorite status');
  return response.json();
};
