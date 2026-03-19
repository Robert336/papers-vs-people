import axios from 'axios';
import type {
  SearchResponse,
  HistoryItem,
  DeepDiveRequest,
  DeepDiveResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const searchApi = {
  search: async (query: string): Promise<SearchResponse> => {
    const response = await api.post<SearchResponse>('/search', { query });
    return response.data;
  },
};

export const historyApi = {
  getHistory: async (): Promise<HistoryItem[]> => {
    const response = await api.get<HistoryItem[]>('/history');
    return response.data;
  },

  getItem: async (id: number): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>(`/history/${id}`);
    return response.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/history/${id}`);
  },
};

export const deepDiveApi = {
  dive: async (request: DeepDiveRequest): Promise<DeepDiveResponse> => {
    const response = await api.post<DeepDiveResponse>('/deepdive', request);
    return response.data;
  },
};
