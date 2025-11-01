import { create } from 'zustand';
import API_ENDPOINTS, { apiRequest } from '../config/api';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_name: string;
  author_id?: string;
  category?: string;
  website?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface BlogState {
  blogs: Blog[];
  currentBlog: Blog | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  fetchBlogs: (params?: {
    status?: string;
    category?: string;
    website?: string;
    author_id?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchBlogById: (id: string) => Promise<void>;
  fetchBlogBySlug: (slug: string) => Promise<void>;
  createBlog: (blogData: Partial<Blog>) => Promise<Blog>;
  updateBlog: (id: string, blogData: Partial<Blog>) => Promise<Blog>;
  deleteBlog: (id: string) => Promise<void>;
  publishBlog: (id: string) => Promise<void>;
  unpublishBlog: (id: string) => Promise<void>;
  incrementViewCount: (id: string) => Promise<void>;
  setCurrentBlog: (blog: Blog | null) => void;
  clearError: () => void;
}

export const useBlogStore = create<BlogState>((set, get) => ({
  blogs: [],
  currentBlog: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },

  fetchBlogs: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.website) queryParams.append('website', params.website);
      if (params.author_id) queryParams.append('author_id', params.author_id);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `${API_ENDPOINTS.BLOGS.BASE}?${queryParams.toString()}`;
      const response = await apiRequest(url);

      // Map MongoDB _id to id for frontend compatibility
      const blogs = response.blogs.map((blog: any) => ({
        ...blog,
        id: blog._id || blog.id
      }));

      set({
        blogs,
        pagination: response.pagination,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchBlogById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const blog = await apiRequest(API_ENDPOINTS.BLOGS.BY_ID(id));
      // Map MongoDB _id to id for frontend compatibility
      const mappedBlog = { ...blog, id: blog._id || blog.id };
      set({ currentBlog: mappedBlog, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchBlogBySlug: async (slug: string) => {
    set({ loading: true, error: null });
    try {
      const blog = await apiRequest(API_ENDPOINTS.BLOGS.BY_SLUG(slug));
      set({ currentBlog: blog, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createBlog: async (blogData: Partial<Blog>) => {
    set({ loading: true, error: null });
    try {
      const blog = await apiRequest(API_ENDPOINTS.BLOGS.BASE, {
        method: 'POST',
        body: JSON.stringify(blogData)
      });

      // Map MongoDB _id to id for frontend compatibility
      const mappedBlog = { ...blog, id: blog._id || blog.id };

      set((state) => ({
        blogs: [mappedBlog, ...state.blogs],
        loading: false
      }));

      return mappedBlog;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateBlog: async (id: string, blogData: Partial<Blog>) => {
    set({ loading: true, error: null });
    try {
      const updatedBlog = await apiRequest(API_ENDPOINTS.BLOGS.BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(blogData)
      });

      // Map MongoDB _id to id for frontend compatibility
      const mappedBlog = { ...updatedBlog, id: updatedBlog._id || updatedBlog.id };

      set((state) => ({
        blogs: state.blogs.map((blog) =>
          blog.id === id ? mappedBlog : blog
        ),
        currentBlog: state.currentBlog?.id === id ? mappedBlog : state.currentBlog,
        loading: false
      }));

      return mappedBlog;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteBlog: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.BLOGS.BY_ID(id), {
        method: 'DELETE'
      });

      set((state) => ({
        blogs: state.blogs.filter((blog) => blog.id !== id),
        currentBlog: state.currentBlog?.id === id ? null : state.currentBlog,
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  publishBlog: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updatedBlog = await apiRequest(API_ENDPOINTS.BLOGS.PUBLISH(id), {
        method: 'PATCH'
      });

      // Map MongoDB _id to id for frontend compatibility
      const mappedBlog = { ...updatedBlog, id: updatedBlog._id || updatedBlog.id };

      set((state) => ({
        blogs: state.blogs.map((blog) =>
          blog.id === id ? mappedBlog : blog
        ),
        currentBlog: state.currentBlog?.id === id ? mappedBlog : state.currentBlog,
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  unpublishBlog: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updatedBlog = await apiRequest(API_ENDPOINTS.BLOGS.UNPUBLISH(id), {
        method: 'PATCH'
      });

      // Map MongoDB _id to id for frontend compatibility
      const mappedBlog = { ...updatedBlog, id: updatedBlog._id || updatedBlog.id };

      set((state) => ({
        blogs: state.blogs.map((blog) =>
          blog.id === id ? mappedBlog : blog
        ),
        currentBlog: state.currentBlog?.id === id ? mappedBlog : state.currentBlog,
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  incrementViewCount: async (id: string) => {
    try {
      await apiRequest(API_ENDPOINTS.BLOGS.VIEW(id), {
        method: 'POST'
      });
    } catch (error: any) {
      console.error('Error incrementing view count:', error);
    }
  },

  setCurrentBlog: (blog: Blog | null) => {
    set({ currentBlog: blog });
  },

  clearError: () => {
    set({ error: null });
  }
}));
