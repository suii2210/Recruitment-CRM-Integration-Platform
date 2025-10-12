import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, TrendingUp, DollarSign, Users, MoreHorizontal, LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BlogManagement from './components/blog/BlogManagement';
import ContentManagement from './components/contentCreation/ContentManagement';
import UserManagement from './components/users/UserManagement';
import RoleManagement from './components/roles/RoleManagement';
import ChatSystem from './components/chat/ChatSystem';
import LoginForm from './components/auth/LoginForm';
import ProfileDropdown from './components/profile/ProfileDropdown';
import ProfileManagement from './components/profile/ProfileManagement';
import RealTimeStats from './components/dashboard/RealTimeStats';
import RecentActivity from './components/dashboard/RecentActivity';
import LiveChart from './components/dashboard/LiveChart';
import { useUserStore } from './store/userStore';
import { useContentStore } from './store/contentStore';
import { useProfileStore } from './store/profileStore';
import { useDashboardStore } from './store/dashboardStore';

import HomeContentManagement from './components/homeContentCreation/HomeContentManagement';











function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const { currentUser, isAuthenticated, logout, hasPermission, checkAuth } = useUserStore();
  const { setCurrentUser: setContentUser } = useContentStore();
  const { preferences, initializePreferences } = useProfileStore();
  const { startRealTimeUpdates, stopRealTimeUpdates } = useDashboardStore();

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize preferences when user is loaded
  useEffect(() => {
    if (currentUser && (currentUser as any).preferences) {
      initializePreferences((currentUser as any).preferences);
    }
  }, [currentUser, initializePreferences]);

  // Sync current user with content store
  useEffect(() => {
    if (currentUser) {
      setContentUser(currentUser);
    }
  }, [currentUser, setContentUser]);

  // Apply theme to document
  useEffect(() => {
    const theme = preferences?.theme || 'dark';
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('light', 'dark');
    
    // Add new theme class
    html.classList.add(theme);
    
    // Also set data attribute for better CSS targeting
    html.setAttribute('data-theme', theme);
    
    console.log('Theme applied:', theme); // Debug log
  }, [preferences?.theme]);

  // Start/stop real-time updates based on authentication and current page
  useEffect(() => {
    if (isAuthenticated && currentPage === 'dashboard') {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    // Cleanup on unmount
    return () => {
      stopRealTimeUpdates();
    };
  }, [isAuthenticated, currentPage, startRealTimeUpdates, stopRealTimeUpdates]);

  const handleNavigation = (page: string) => {
    // Define pages that don't require permission checks
    const publicPages = ['dashboard', 'chat', 'profile'];
    
    // Check permissions for restricted pages only
    if (!publicPages.includes(page)) {
      const permissionMap: { [key: string]: string } = {
        'blogs': 'blogs.view',
        'contents': 'contents.view',
        'home': 'home-contents.view',
        'users': 'users.view',
        'roles': 'roles.view',
        'email': 'email.view',
        'calendar': 'calendar.view',
        'kanban': 'kanban.view',
        'tasks': 'tasks.view',
        'invoice': 'invoice.view',
        'reports': 'reports.view',
        'analytics': 'analytics.view',
        'performance': 'performance.view',
        'data': 'data.view',
        'settings': 'settings.view',
        'notifications': 'notifications.view',
        'security': 'security.view',
        'help': 'help.view',
        'news-home': 'news.view',
        'live-tv': 'news.view',
        'videos': 'news.view',
        'world': 'news.view',
        'viral': 'news.view',
        'latest': 'news.view',
        'india': 'news.view',
        'stories': 'news.view',
        'science': 'news.view',
        'opinion': 'news.view',
        'entertainment': 'news.view',
        'defence': 'news.view',
        'sport': 'news.view',
        'education': 'news.view',
        'election': 'news.view',
        'health': 'news.view',
        'tech': 'news.view',
        'initiatives': 'news.view'
      };

      const requiredPermission = permissionMap[page];
      if (requiredPermission && !hasPermission(requiredPermission)) {
        alert('You don\'t have permission to access this section.');
        return;
      }
    }

    setCurrentPage(page);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      setCurrentPage('dashboard');
    }
  };

  const handleProfileClick = () => {
    setCurrentPage('profile');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'blogs':
        return <BlogManagement />;
      case 'contents':
        return <ContentManagement />;
      case 'home':
        return <HomeContentManagement />; 
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'chat':
        return <ChatSystem />;
      case 'profile':
        return <ProfileManagement onBack={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
      default:
        return (
          <div className="p-6">
            {/* Real-time Stats */}
            <RealTimeStats />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Live Chart - Spans 2 columns */}
              <div className="lg:col-span-2">
                <LiveChart />
              </div>
              
              {/* Recent Activity */}
              <div className="lg:col-span-1">
                <RecentActivity />
              </div>
            </div>
          </div>
        );
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => {}} />;
  }

  return (
    <div className="h-screen bg-slate-900 dark:bg-slate-900 light:bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Fixed height with independent scroll */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />
      
      {/* Main Content Area - Fixed height with independent scroll */}
      <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden">
        {/* Header - Fixed at top */}
        <header className="bg-slate-800 dark:bg-slate-800 light:bg-white border-b border-slate-700 dark:border-slate-700 light:border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-slate-300 dark:text-slate-300 light:text-gray-600 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-white dark:text-white light:text-gray-900 capitalize">
                {currentPage === 'dashboard' ? 'Dashboard' : 
                 currentPage === 'profile' ? 'Profile Management' :
                 currentPage === 'chat' ? 'Messages' :
                 currentPage.replace('-', ' ')}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ProfileDropdown 
                onProfileClick={handleProfileClick}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className={`flex-1 overflow-hidden bg-slate-900 dark:bg-slate-900 light:bg-gray-50 ${currentPage === 'chat' ? '' : 'overflow-y-auto hide-scrollbar'}`}>
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;