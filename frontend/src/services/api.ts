import axios from 'axios';
import type {
  SearchResponse,
  HistoryItem,
  DeepDiveRequest,
  DeepDiveResponse,
  CompareSearchResponse,
  OpenRouterModel,
  SearchMode,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
  transitional: {
    silentJSONParsing: true,
  },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  (config.headers as Record<string, string>)['Keep-Alive'] = 'timeout=120, max=10';
  return config;
});

export const searchApi = {
  search: async (query: string, socialPlatforms?: string[], model?: string, mode?: SearchMode): Promise<SearchResponse> => {
    const payload: Record<string, unknown> = { query };
    if (socialPlatforms) {
      payload.social_platforms = socialPlatforms;
    }
    if (model) {
      payload.model = model;
    }
    if (mode) {
      payload.mode = mode;
    }
    const response = await api.post<SearchResponse>('/search', payload);
    return response.data;
  },

  compare: async (
    query: string,
    socialPlatforms: string[] | undefined,
    modelA: string,
    modelB: string,
    mode?: SearchMode,
  ): Promise<CompareSearchResponse> => {
    const payload: Record<string, unknown> = {
      query,
      model_a: modelA,
      model_b: modelB,
    };
    if (socialPlatforms) {
      payload.social_platforms = socialPlatforms;
    }
    if (mode) {
      payload.mode = mode;
    }
    const response = await api.post<CompareSearchResponse>('/search/compare', payload);
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

export const modelsApi = {
  fetchOpenRouterModels: async (): Promise<OpenRouterModel[]> => {
    const response = await api.get<OpenRouterModel[]>('/models/openrouter');
    return response.data;
  },
};
