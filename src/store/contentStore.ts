import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface Content {
  _id: string;
  id: string; // Add for compatibility
  title: string;
  content: string;
  author: string;
  authorId: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  tags: string[];
  pages: string[];
  imageUrl?: string;
  publishDate?: string;
  publishedAt?: string;
  views: number;
  likes: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentStore {
  contents: Content[];
  loading: boolean;
  error: string | null;
  currentUser: any;
  currentPage: number;
  totalPages: number;
  total: number;
  
  // Actions
  setCurrentUser: (user: any) => void;
  fetchContents: (page?: number, limit?: number, search?: string, status?: string) => Promise<void>;
  setPage: (page: number) => void;
  createContent: (contentData: Omit<Content, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'slug'>) => Promise<void>;
  updateContent: (id: string, contentData: Partial<Content>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  publishContent: (id: string) => Promise<void>;
  rejectContent: (id: string, reason: string) => Promise<void>;
  searchContents: (searchTerm: string) => Content[];
  filterContentsByStatus: (status: string) => Content[];
}

export const useContentStore = create<ContentStore>((set, get) => ({
  contents: [],
  loading: false,
  error: null,
  currentUser: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  setPage: (page) => {
    set({ currentPage: page });
  },

  fetchContents: async (page = 1, limit = 10, search = '', status = '') => {
    set({ loading: true, error: null });
    try {
      let url = `${API_ENDPOINTS.CONTENTS.BASE}?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status && status !== 'all') url += `&status=${status}`;
      
      const response = await apiRequest(url);
      const contents = (response.contents || response).map((content: any) => ({
        ...content,
        id: content._id || content.id
      }));
      set({ 
        contents, 
        loading: false,
        currentPage: response.currentPage || page,
        totalPages: response.totalPages || 1,
        total: response.total || contents.length
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createContent: async (contentData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.CONTENTS.BASE, {
        method: 'POST',
        body: JSON.stringify(contentData),
      });
      
      const newContent = {
        ...response.content,
        id: response.content._id || response.content.id
      };
      
      set(state => ({ 
        contents: [newContent, ...state.contents], 
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateContent: async (id, contentData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.CONTENTS.BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(contentData),
      });
      
      const updatedContent = {
        ...response.content,
        id: response.content._id || response.content.id
      };
      
      set(state => ({
        contents: state.contents.map(content => 
          (content._id === id || content.id === id) ? updatedContent : content
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteContent: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.CONTENTS.BY_ID(id), {
        method: 'DELETE',
      });
      
      set(state => ({
        contents: state.contents.filter(content => content._id !== id && content.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  publishContent: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.CONTENTS.PUBLISH(id), {
        method: 'PATCH',
      });
      
      const updatedContent = {
        ...response.content,
        id: response.content._id || response.content.id
      };
      
      set(state => ({
        contents: state.contents.map(content => 
          (content._id === id || content.id === id) ? updatedContent : content
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectContent: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.CONTENTS.REJECT(id), {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      
      const updatedContent = {
        ...response.content,
        id: response.content._id || response.content.id
      };
      
      set(state => ({
        contents: state.contents.map(content => 
          (content._id === id || content.id === id) ? updatedContent : content
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  searchContents: (searchTerm) => {
    const { contents } = get();
    return contents.filter(content =>
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },

  filterContentsByStatus: (status) => {
    const { contents } = get();
    return contents.filter(content => content.status === status);
  }
}));