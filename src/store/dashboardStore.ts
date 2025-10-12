import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBlogs: number;
  publishedBlogs: number;
  pendingBlogs: number;
  draftBlogs: number;
  totalRoles: number;
  recentLogins: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  serverUptime: string;
}

interface RecentActivity {
  id: string;
  type: 'user_login' | 'user_created' | 'blog_created' | 'blog_published' | 'role_created' | 'password_changed' | 'profile_updated';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  description: string;
  timestamp: string;
  metadata?: any;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  activeConnections: number;
  requestsPerMinute: number;
  responseTime: number;
}

interface DashboardStore {
  stats: DashboardStats | null;
  recentActivities: RecentActivity[];
  systemMetrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchRecentActivities: () => Promise<void>;
  fetchSystemMetrics: () => Promise<void>;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
}

// Mock data generator for demonstration
const generateMockStats = (): DashboardStats => ({
  totalUsers: Math.floor(Math.random() * 1000) + 500,
  activeUsers: Math.floor(Math.random() * 200) + 50,
  totalBlogs: Math.floor(Math.random() * 500) + 100,
  publishedBlogs: Math.floor(Math.random() * 300) + 50,
  pendingBlogs: Math.floor(Math.random() * 20) + 5,
  draftBlogs: Math.floor(Math.random() * 50) + 10,
  totalRoles: Math.floor(Math.random() * 10) + 5,
  recentLogins: Math.floor(Math.random() * 50) + 10,
  systemHealth: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as any,
  serverUptime: `${Math.floor(Math.random() * 30) + 1} days`
});

const generateMockActivities = (): RecentActivity[] => {
  const activities = [
    'user_login', 'user_created', 'blog_created', 'blog_published', 'role_created', 'password_changed', 'profile_updated'
  ];
  
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Author' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Viewer' },
  ];

  const descriptions = {
    user_login: 'Logged into the system',
    user_created: 'Created a new user account',
    blog_created: 'Created a new blog post',
    blog_published: 'Published a blog post',
    role_created: 'Created a new role',
    password_changed: 'Changed account password',
    profile_updated: 'Updated profile information'
  };

  return Array.from({ length: 20 }, (_, i) => {
    const type = activities[Math.floor(Math.random() * activities.length)] as any;
    const user = users[Math.floor(Math.random() * users.length)];
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    return {
      id: `activity-${i}`,
      type,
      user,
      description: descriptions[type],
      timestamp,
      metadata: type === 'blog_created' ? { title: `Blog Post ${i + 1}` } : undefined
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockMetrics = (): SystemMetrics => ({
  cpu: Math.floor(Math.random() * 100),
  memory: Math.floor(Math.random() * 100),
  storage: Math.floor(Math.random() * 100),
  activeConnections: Math.floor(Math.random() * 500) + 100,
  requestsPerMinute: Math.floor(Math.random() * 1000) + 200,
  responseTime: Math.floor(Math.random() * 500) + 50
});

let updateInterval: NodeJS.Timeout | null = null;

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  stats: null,
  recentActivities: [],
  systemMetrics: null,
  loading: false,
  error: null,
  lastUpdated: null,

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      // In a real application, this would fetch from your API
      // For now, we'll use mock data and also try to fetch real data
      
      const [mockStats, realUsers, realBlogs, realRoles] = await Promise.allSettled([
        Promise.resolve(generateMockStats()),
        apiRequest(API_ENDPOINTS.USERS.BASE).catch(() => ({ users: [] })),
        apiRequest(API_ENDPOINTS.BLOGS.BASE).catch(() => ({ blogs: [] })),
        apiRequest(API_ENDPOINTS.ROLES.BASE).catch(() => [])
      ]);

      let stats = mockStats.status === 'fulfilled' ? mockStats.value : generateMockStats();
      
      // Override with real data if available
      if (realUsers.status === 'fulfilled') {
        const users = realUsers.value.users || realUsers.value;
        stats.totalUsers = users.length;
        stats.activeUsers = users.filter((u: any) => u.status === 'active').length;
      }
      
      if (realBlogs.status === 'fulfilled') {
        const blogs = realBlogs.value.blogs || realBlogs.value;
        stats.totalBlogs = blogs.length;
        stats.publishedBlogs = blogs.filter((b: any) => b.status === 'published').length;
        stats.pendingBlogs = blogs.filter((b: any) => b.status === 'pending').length;
        stats.draftBlogs = blogs.filter((b: any) => b.status === 'draft').length;
      }
      
      if (realRoles.status === 'fulfilled') {
        const roles = realRoles.value;
        stats.totalRoles = roles.length;
      }

      set({ 
        stats, 
        loading: false, 
        lastUpdated: new Date().toISOString() 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRecentActivities: async () => {
    try {
      // In a real application, this would fetch from your API
      // For now, we'll use mock data
      const activities = generateMockActivities();
      set({ recentActivities: activities });
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    }
  },

  fetchSystemMetrics: async () => {
    try {
      // Try to fetch real health data, fallback to mock
      const healthData = await apiRequest(API_ENDPOINTS.HEALTH).catch(() => null);
      const metrics = generateMockMetrics();
      
      if (healthData) {
        // Use real health data if available
        metrics.responseTime = 100; // Assume good response time if API is working
      }
      
      set({ systemMetrics: metrics });
    } catch (error: any) {
      console.error('Error fetching system metrics:', error);
    }
  },

  startRealTimeUpdates: () => {
    const { fetchDashboardData, fetchRecentActivities, fetchSystemMetrics } = get();
    
    // Initial fetch
    fetchDashboardData();
    fetchRecentActivities();
    fetchSystemMetrics();
    
    // Set up interval for real-time updates
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivities();
      fetchSystemMetrics();
    }, 30000); // Update every 30 seconds
  },

  stopRealTimeUpdates: () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
}));