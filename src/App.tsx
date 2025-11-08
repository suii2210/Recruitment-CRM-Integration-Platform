import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BlogManagement from './components/blog/BlogManagement';
import ContentManagement from './components/contentCreation/ContentManagement';
import CareerManagement from './components/careers/CareerManagement';
import ApplicantManagement from './components/careers/ApplicantManagement';
import TaskManagement from './components/careers/TaskManagement';
import CandidateDashboard from './components/candidate/CandidateDashboard';
import HiredMembers from './components/careers/HiredMembers';
import UserManagement from './components/users/UserManagement';
import RoleManagement from './components/roles/RoleManagement';
import ChatSystem from './components/chat/ChatSystem';
import LoginForm from './components/auth/LoginForm';
import ProfileDropdown from './components/profile/ProfileDropdown';
import NotificationBell from './components/NotificationBell';
import ProfileManagement from './components/profile/ProfileManagement';
import SalesCards from './components/SalesCards';
import LevelChart from './components/LevelChart';
import TopProducts from './components/TopProducts';
import CustomerFulfillment from './components/CustomerFulfillment';
import ClickSpark from './components/ClickSpark';
import { useUserStore } from './store/userStore';
import { useContentStore } from './store/contentStore';
import { useProfileStore } from './store/profileStore';
import { useDashboardStore } from './store/dashboardStore';
import HomeContentManagement from './components/homeContentCreation/HomeContentManagement';
import { useApplicationStore } from './store/applicationStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const { currentUser, isAuthenticated, logout, hasPermission, checkAuth } = useUserStore();
  const { setCurrentUser: setContentUser } = useContentStore();
  const { preferences, initializePreferences } = useProfileStore();
  const { startRealTimeUpdates, stopRealTimeUpdates } = useDashboardStore();
  const applications = useApplicationStore((state) => state.applications);
  const fetchApplicationById = useApplicationStore((state) => state.fetchApplicationById);
  const setCurrentApplication = useApplicationStore((state) => state.setCurrentApplication);

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

  const isCandidate = currentUser?.role?.toLowerCase() === 'candidate';

  // Start/stop real-time updates based on authentication and current page
  useEffect(() => {
    if (isAuthenticated && currentPage === 'dashboard' && !isCandidate) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    // Cleanup on unmount
    return () => {
      stopRealTimeUpdates();
    };
  }, [isAuthenticated, currentPage, isCandidate, startRealTimeUpdates, stopRealTimeUpdates]);

  const handleNavigation = (page: string) => {
    // Define pages that don't require permission checks
    const publicPages = ['dashboard', 'chat', 'profile'];
    
    // Check permissions for restricted pages only
    if (!publicPages.includes(page)) {
      const permissionMap: { [key: string]: string } = {
        'blogs': 'blogs.view',
        'careers': 'jobs.view',
        'applicants': 'job-applications.view',
        'hires': 'job-applications.view',
        'contents': 'contents.view',
        'home': 'home-contents.view',
        'users': 'users.view',
        'roles': 'roles.view',
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

  const handleNotificationNavigate = useCallback(
    async (applicationId: string) => {
      if (!applicationId) return;
      let target =
        applications.find((application) => application.id === applicationId) ||
        null;
      if (!target) {
        target = await fetchApplicationById(applicationId);
      }
      if (target) {
        setCurrentApplication(target);
        setCurrentPage('applicants');
      } else {
        alert('Unable to open this applicant. They may have been removed.');
      }
    },
    [applications, fetchApplicationById, setCurrentApplication]
  );

  if (isCandidate) {
    return (
      <ClickSpark sparkColor="#22d3ee" sparkCount={6} sparkRadius={20}>
        <div className="h-screen bg-[#0d0e0a] flex flex-col">
          <header className="bg-[#15170f] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <h1 className="text-white font-semibold text-lg">My workspace</h1>
            <ProfileDropdown onProfileClick={() => {}} onLogout={handleLogout} />
          </header>
          <main className="flex-1 overflow-y-auto">
            <CandidateDashboard />
          </main>
        </div>
      </ClickSpark>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'blogs':
        return <BlogManagement />;
      case 'contents':
        return <ContentManagement />;
      case 'careers':
        return <CareerManagement />;
      case 'applicants':
        return <ApplicantManagement />;
      case 'tasks':
        return <TaskManagement />;
      case 'hires':
        return <HiredMembers />;
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Section - Takes 2 columns */}
              <div className="xl:col-span-2 space-y-6">
                <SalesCards />
                <TopProducts />
              </div>

              {/* Right Section - Takes 1 column */}
              <div className="space-y-6">
                <LevelChart />
                <CustomerFulfillment />
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
    <ClickSpark sparkColor="#22d3ee" sparkCount={6} sparkRadius={20}>
      <div className="h-screen bg-[#0d0e0a] flex overflow-hidden">
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
          <header className="bg-[#15170f] border-b border-gray-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg bg-[#0d0e0a] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-white capitalize">
                  {currentPage === 'dashboard' ? 'Dashboard' : 
                   currentPage === 'profile' ? 'Profile Management' :
                   currentPage === 'chat' ? 'Messages' :
                   currentPage === 'careers' ? 'Careers' :
                   currentPage === 'applicants' ? 'Applicants' :
                   currentPage === 'hires' ? 'Hires' :
                   currentPage.replace('-', ' ')}
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <NotificationBell onNavigateToApplicant={handleNotificationNavigate} />
                <ProfileDropdown 
                  onProfileClick={handleProfileClick}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          {/* Main Content - Scrollable */}
          <main className={`flex-1 overflow-hidden bg-[#0d0e0a] ${currentPage === 'chat' ? '' : 'overflow-y-auto'}`}>
            {renderCurrentPage()}
          </main>
        </div>
      </div>
    </ClickSpark>
  );
}

export default App;
