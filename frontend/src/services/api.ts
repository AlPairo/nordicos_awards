import axios from 'axios';
import {
  User,
  Category,
  CategoryWithNominees,
  Nominee,
  CreateNominee,
  Vote,
  MediaUpload,
  VotingResults,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post('/auth/token', {
      username: credentials.username,
      password: credentials.password
    });
    return response.data.data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', userData);
    return response.data.data.user;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },
};

export const categories = {
  getAll: async (year?: number, activeOnly: boolean = true): Promise<CategoryWithNominees[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (!activeOnly) params.append('active_only', 'false');
    
    const response = await api.get(`/categories?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<CategoryWithNominees> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  create: async (category: Omit<Category, 'id' | 'is_active' | 'created_at'>): Promise<Category> => {
    const response = await api.post('/categories/', category);
    return response.data.data;
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export const nominees = {
  getAll: async (categoryId?: string, activeOnly: boolean = true): Promise<Nominee[]> => {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (!activeOnly) params.append('active_only', 'false');
    
    const response = await api.get(`/nominees?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Nominee> => {
    const response = await api.get(`/nominees/${id}`);
    return response.data.data;
  },

  create: async (nominee: CreateNominee): Promise<Nominee> => {
    const response = await api.post('/nominees/', nominee);
    return response.data.data;
  },

  update: async (id: string, nominee: Partial<Nominee>): Promise<Nominee> => {
    const response = await api.put(`/nominees/${id}`, nominee);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/nominees/${id}`);
  },
};

export const votes = {
  create: async (nomineeId: string, categoryId: string): Promise<Vote> => {
    const response = await api.post('/votes/', { 
      nominee: nomineeId,
      category: categoryId
    });
    return response.data.data;
  },

  getMyVotes: async (): Promise<Vote[]> => {
    const response = await api.get('/votes/my');
    return response.data.data;
  },

  getResults: async (categoryId?: string): Promise<VotingResults[]> => {
    const params = categoryId ? `?category=${categoryId}` : '';
    const response = await api.get(`/votes/results${params}`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/votes/${id}`);
  },
};

export const media = {
  upload: async (file: File, description?: string): Promise<MediaUpload> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    
    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  getMyUploads: async (): Promise<MediaUpload[]> => {
    const response = await api.get('/media');
    return response.data.data;
  },

  getAllUploads: async (status?: string): Promise<MediaUpload[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/media${params}`);
    return response.data.data;
  },

  getPendingUploads: async (): Promise<MediaUpload[]> => {
    const response = await api.get('/media/pending');
    return response.data.data;
  },

  review: async (mediaId: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<any> => {
    const response = await api.post('/media/review', {
      mediaId,
      status,
      adminNotes
    });
    return response.data.data;
  },

  adminDelete: async (mediaId: string): Promise<void> => {
    await api.delete(`/media/admin/${mediaId}`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/media/${id}`);
  },
};

export default api;
