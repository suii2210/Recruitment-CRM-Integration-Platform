import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface HomeContentItem {
  _id?: string;
  id: number;
  title: string;
  content: string;
  author: string;
  authorId?: string;
  publishDate: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'draft' | 'pending' | 'rejected';
  imageUrl: string;
  imagePublicId?: string;
  tags: string[];
  pages: string[];
  subsection?: string;
  views?: number;
  likes?: number;
  featured?: boolean;
  metaDescription?: string;
  slug?: string;
  // Backward compatibility
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface HomeContentStats {
  total: number;
  published: number;
  pending: number;
  drafts: number;
}

export interface HomeContentFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  tags?: string;
  selectedPages?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateHomeContentData {
  title: string;
  content: string;
  author?: string;
  publishDate?: string;
  status?: 'published' | 'draft' | 'pending' | 'rejected';
  tags?: string[];
  pages?: string[];
  subsection?: string;
  featured?: boolean;
  metaDescription?: string;
  imageUrl?: string;
  featuredImage?: File;
}

interface HomeContentStore {
  homeContents: HomeContentItem[];
  loading: boolean;
  error: string | null;
  stats: HomeContentStats;
  filters: HomeContentFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  
  // Actions
  fetchHomeContents: (filters?: HomeContentFilters) => Promise<void>;
  createHomeContent: (homeContent: CreateHomeContentData) => Promise<void>;
  updateHomeContent: (id: number, data: Partial<CreateHomeContentData>) => Promise<void>;
  deleteHomeContent: (id: number) => Promise<void>;
  publishHomeContent: (id: number) => Promise<void>;
  unpublishHomeContent: (id: number) => Promise<void>;
  toggleFeatured: (id: number) => Promise<void>;
  getHomeContentById: (id: number) => HomeContentItem | undefined;
  fetchStats: () => Promise<void>;
  setFilters: (filters: HomeContentFilters) => void;
  clearError: () => void;
}

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      searchParams.append(key, String(params[key]));
    }
  });
  
  return searchParams.toString();
};

// Helper function for FormData API calls
const apiCallFormData = async (url: string, formData: FormData, method: string = 'POST') => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useHomeContentStore = create<HomeContentStore>((set, get) => ({
  homeContents: [],
  loading: false,
  error: null,
  stats: {
    total: 0,
    published: 0,
    pending: 0,
    drafts: 0
  },
  filters: {},
  pagination: null,

  fetchHomeContents: async (filters?: HomeContentFilters) => {
    set({ loading: true, error: null });
    
    try {
      const currentFilters = filters || get().filters;
      const queryString = buildQueryString(currentFilters);
      const url = queryString ? `${API_ENDPOINTS.HOME_CONTENTS.BASE}?${queryString}` : API_ENDPOINTS.HOME_CONTENTS.BASE;
      
      const response = await apiRequest(url);
      
      if (response.success) {
        const normalizedData = response.data.map((item: any) => ({
          ...item,
          id: item._id || item.id
        }));
        set({ 
          homeContents: normalizedData, 
          pagination: response.pagination || null,
          filters: currentFilters,
          loading: false 
        });
      } else {
        throw new Error('Failed to fetch home contents');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch home contents',
        loading: false 
      });
    }
  },

  createHomeContent: async (homeContentData: CreateHomeContentData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.BASE, {
        method: 'POST',
        body: JSON.stringify(homeContentData)
      });
      
      if (response.success) {
        await get().fetchHomeContents();
        set({ loading: false });
      } else {
        throw new Error(response.message || 'Failed to create home content');
      }
      
      await get().fetchStats();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create home content',
        loading: false 
      });
    }
  },

  updateHomeContent: async (id: number, data: Partial<CreateHomeContentData>) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.BY_ID(String(id)), {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (response.success) {
        await get().fetchHomeContents();
        set({ loading: false });
      } else {
        throw new Error(response.message || 'Failed to update home content');
      }
      
      await get().fetchStats();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update home content',
        loading: false 
      });
    }
  },

  deleteHomeContent: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.BY_ID(String(id)), {
        method: 'DELETE',
      });
      
      if (response.success) {
        // Refresh the list to get updated data
        await get().fetchHomeContents();
        set({ loading: false });
      } else {
        throw new Error(response.message || 'Failed to delete home content');
      }
      
      await get().fetchStats();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete home content',
        loading: false 
      });
    }
  },

  publishHomeContent: async (id: number) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.PUBLISH(String(id)), {
        method: 'PATCH',
      });
      
      if (response.success) {
        // Refresh the list to get updated data
        await get().fetchHomeContents();
        set({ loading: false });
      } else {
        throw new Error(response.message || 'Failed to publish home content');
      }
      
      await get().fetchStats();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to publish home content',
        loading: false 
      });
    }
  },

  unpublishHomeContent: async (id: number) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.UNPUBLISH(String(id)), {
        method: 'PATCH',
      });
      
      if (response.success) {
        // Refresh the list to get updated data
        await get().fetchHomeContents();
        set({ loading: false });
      } else {
        throw new Error(response.message || 'Failed to unpublish home content');
      }
      
      await get().fetchStats();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to unpublish home content',
        loading: false 
      });
    }
  },

  toggleFeatured: async (id: number) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.FEATURE(String(id)), {
        method: 'PATCH',
      });
      
      if (response.success) {
        // Refresh the list to get updated data
        await get().fetchHomeContents();
        set({ loading: false });
      } else {
        throw new Error(response.message || 'Failed to toggle featured status');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle featured status',
        loading: false 
      });
    }
  },

  getHomeContentById: (id) => {
    return get().homeContents.find(homeContent => homeContent.id === id);
  },

  fetchStats: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.HOME_CONTENTS.STATS);
      
      if (response.success) {
        set({ stats: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  setFilters: (filters: HomeContentFilters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  }
}));