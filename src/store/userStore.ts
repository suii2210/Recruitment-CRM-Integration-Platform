import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../config/api';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  _id: string;
  id: string; // Add this for compatibility
  name: string;
  description: string;
  permissions: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  twitter: string;
  linkedin: string;
}

export interface User {
  _id: string;
  id: string; // Add this for compatibility
  name: string;
  email: string;
  role: string;
  roleId: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  socialLinks?: SocialLinks;
}

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  roles: Role[];
  permissions: Permission[];
  userPermissions: string[]; // Add this to store current user's permissions
  loading: boolean;
  error: string | null;
  token: string | null;
}

interface UserStore extends AuthState {
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // User management
  fetchUsers: () => Promise<void>;
  createUser: (userData: Omit<User, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  
  // Role management
  fetchRoles: () => Promise<void>;
  createRole: (roleData: Omit<Role, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRole: (id: string, roleData: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  
  // Permission management
  fetchPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getUserRole: (userId: string) => Role | null;
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  users: [],
  roles: [],
  permissions: [],
  userPermissions: [],
  loading: false,
  error: null,
  token: getAuthToken(),

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { token, user, permissions } = response;
      
      // Normalize user data
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        roleId: user.roleId?._id || user.roleId,
        socialLinks: user.socialLinks || { twitter: '', linkedin: '' }
      };
      
      console.log('Normalized user with social links:', normalizedUser);
      
      const isCandidate = (normalizedUser.role || '').toLowerCase() === 'candidate';

      setAuthToken(token);
      set({ 
        currentUser: normalizedUser, 
        isAuthenticated: true, 
        loading: false,
        token,
        userPermissions: permissions || []
      });
      
      if (isCandidate) {
        set({ roles: [], permissions: [] });
      } else {
        await get().fetchRoles();
        await get().fetchPermissions();
      }
      
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  logout: () => {
    removeAuthToken();
    set({ 
      currentUser: null, 
      isAuthenticated: false, 
      token: null,
      userPermissions: [],
      users: [],
      roles: [],
      permissions: []
    });
  },

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) return;

    set({ loading: true });
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.ME);
      const { user, permissions } = response;
      
      console.log('User data from ME endpoint:', user);
      
      // Normalize user data
      const normalizedUser = {
        ...user,
        id: user._id || user.id,
        roleId: user.roleId?._id || user.roleId,
        socialLinks: user.socialLinks || { twitter: '', linkedin: '' }
      };
      const isCandidate = (normalizedUser.role || '').toLowerCase() === 'candidate';
      
      console.log('Normalized user with social links:', normalizedUser);
      
      set({ 
        currentUser: normalizedUser, 
        isAuthenticated: true, 
        loading: false,
        token,
        userPermissions: permissions || []
      });
      
      if (isCandidate) {
        set({ roles: [], permissions: [] });
      } else {
        await get().fetchRoles();
        await get().fetchPermissions();
      }
    } catch (error) {
      removeAuthToken();
      set({ 
        currentUser: null, 
        isAuthenticated: false, 
        loading: false,
        token: null,
        userPermissions: []
      });
    }
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.USERS.BASE);
      const users = (response.users || response).map((user: any) => ({
        ...user,
        id: user._id || user.id
      }));
      set({ users, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.USERS.BASE, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      const newUser = {
        ...response.user,
        id: response.user._id || response.user.id
      };
      
      set(state => ({
        users: [newUser, ...state.users],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      console.log('Updating user with data:', userData);
      const response = await apiRequest(API_ENDPOINTS.USERS.BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      
      const updatedUser = {
        ...response.user,
        id: response.user._id || response.user.id
      };
      
      // If this is the current user, update currentUser as well
      const currentUser = get().currentUser;
      if (currentUser && (currentUser._id === id || currentUser.id === id)) {
        set({
          currentUser: {
            ...currentUser,
            ...userData
          }
        });
      }
      
      set(state => ({
        users: state.users.map(user => 
          (user._id === id || user.id === id) ? updatedUser : user
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.USERS.BY_ID(id), {
        method: 'DELETE',
      });
      
      set(state => ({
        users: state.users.filter(user => user._id !== id && user.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  toggleUserStatus: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.USERS.TOGGLE_STATUS(id), {
        method: 'PATCH',
      });
      
      const updatedUser = {
        ...response.user,
        id: response.user._id || response.user.id
      };
      
      set(state => ({
        users: state.users.map(user => 
          (user._id === id || user.id === id) ? updatedUser : user
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchRoles: async () => {
    try {
      const roles = await apiRequest(API_ENDPOINTS.ROLES.BASE);
      const normalizedRoles = roles.map((role: any) => ({
        ...role,
        id: role._id || role.id
      }));
      set({ roles: normalizedRoles });
    } catch (error: any) {
      console.error('Error fetching roles:', error);
    }
  },

  createRole: async (roleData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.ROLES.BASE, {
        method: 'POST',
        body: JSON.stringify(roleData),
      });
      
      const newRole = {
        ...response.role,
        id: response.role._id || response.role.id
      };
      
      set(state => ({
        roles: [newRole, ...state.roles],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateRole: async (id, roleData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.ROLES.BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(roleData),
      });
      
      const updatedRole = {
        ...response.role,
        id: response.role._id || response.role.id
      };
      
      set(state => ({
        roles: state.roles.map(role => 
          (role._id === id || role.id === id) ? updatedRole : role
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteRole: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.ROLES.BY_ID(id), {
        method: 'DELETE',
      });
      
      set(state => ({
        roles: state.roles.filter(role => role._id !== id && role.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPermissions: async () => {
    try {
      const permissions = await apiRequest(API_ENDPOINTS.PERMISSIONS.BASE);
      set({ permissions });
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
    }
  },

  hasPermission: (permission: string) => {
    const { currentUser, userPermissions, roles } = get();
    if (!currentUser) return false;
    
    // Check if user is Super Admin (has all permissions)
    if (currentUser.role === 'Super Admin') return true;
    
    // Check from stored user permissions first
    if (userPermissions && userPermissions.includes(permission)) return true;
    
    // Fallback: check role permissions
    const userRole = roles.find(role => 
      role._id === currentUser.roleId || role.id === currentUser.roleId
    );
    
    return userRole?.permissions.includes(permission) || false;
  },

  getUserRole: (userId: string) => {
    const { users, roles } = get();
    const user = users.find(u => u._id === userId || u.id === userId);
    if (!user) return null;
    
    return roles.find(role => 
      role._id === user.roleId || role.id === user.roleId
    ) || null;
  }
}));
