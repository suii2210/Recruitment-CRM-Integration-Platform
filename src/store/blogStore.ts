import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface Blog {
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

interface BlogStore {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
  currentUser: any;
  currentPage: number;
  totalPages: number;
  total: number;
  
  // Actions
  setCurrentUser: (user: any) => void;
  fetchBlogs: (page?: number, limit?: number, search?: string, status?: string) => Promise<void>;
  setPage: (page: number) => void;
  createBlog: (blogData: Omit<Blog, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'slug'>) => Promise<void>;
  updateBlog: (id: string, blogData: Partial<Blog>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  publishBlog: (id: string) => Promise<void>;
  rejectBlog: (id: string, reason: string) => Promise<void>;
  searchBlogs: (searchTerm: string) => Blog[];
  filterBlogsByStatus: (status: string) => Blog[];
}

export const useBlogStore = create<BlogStore>((set, get) => ({
  blogs: [],
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

  fetchBlogs: async (page = 1, limit = 10, search = '', status = '') => {
    set({ loading: true, error: null });
    try {
      let url = `${API_ENDPOINTS.BLOGS.BASE}?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status && status !== 'all') url += `&status=${status}`;
      
      const response = await apiRequest(url);
      const blogs = (response.blogs || response).map((blog: any) => ({
        ...blog,
        id: blog._id || blog.id
      }));
      set({ 
        blogs, 
        loading: false,
        currentPage: response.currentPage || page,
        totalPages: response.totalPages || 1,
        total: response.total || blogs.length
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createBlog: async (blogData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.BLOGS.BASE, {
        method: 'POST',
        body: JSON.stringify(blogData),
      });
      
      const newBlog = {
        ...response.blog,
        id: response.blog._id || response.blog.id
      };
      
      set(state => ({ 
        blogs: [newBlog, ...state.blogs], 
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateBlog: async (id, blogData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.BLOGS.BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(blogData),
      });
      
      const updatedBlog = {
        ...response.blog,
        id: response.blog._id || response.blog.id
      };
      
      set(state => ({
        blogs: state.blogs.map(blog => 
          (blog._id === id || blog.id === id) ? updatedBlog : blog
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteBlog: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.BLOGS.BY_ID(id), {
        method: 'DELETE',
      });
      
      set(state => ({
        blogs: state.blogs.filter(blog => blog._id !== id && blog.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  publishBlog: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.BLOGS.PUBLISH(id), {
        method: 'PATCH',
      });
      
      const updatedBlog = {
        ...response.blog,
        id: response.blog._id || response.blog.id
      };
      
      set(state => ({
        blogs: state.blogs.map(blog => 
          (blog._id === id || blog.id === id) ? updatedBlog : blog
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectBlog: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.BLOGS.REJECT(id), {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      
      const updatedBlog = {
        ...response.blog,
        id: response.blog._id || response.blog.id
      };
      
      set(state => ({
        blogs: state.blogs.map(blog => 
          (blog._id === id || blog.id === id) ? updatedBlog : blog
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  searchBlogs: (searchTerm) => {
    const { blogs } = get();
    return blogs.filter(blog =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },

  filterBlogsByStatus: (status) => {
    const { blogs } = get();
    return blogs.filter(blog => blog.status === status);
  }
}));