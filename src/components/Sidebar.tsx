import React from 'react';
import { 
  Home, 
  FileText, 
  Edit3, 
  Users, 
  Shield, 
  MessageSquare, 
  User,
  Zap
} from 'lucide-react';
import { useUserStore } from '../store/userStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPage, onNavigate }) => {
  const { hasPermission } = useUserStore();
  const [isHovered, setIsHovered] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', permission: null },
    { id: 'blogs', icon: FileText, label: 'Blogs', permission: 'blogs.view' },
    { id: 'users', icon: Users, label: 'Users', permission: 'users.view' },
    { id: 'roles', icon: Shield, label: 'Roles', permission: 'roles.view' },
    { id: 'profile', icon: User, label: 'Profile', permission: null },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isHovered ? 'w-64' : 'w-[90px]'} bg-[#15170f] border-r border-gray-800
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-center">
          <Zap className="w-8 h-8 text-green-400" style={{ filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))' }} />
          {isHovered && (
            <div className="ml-3 overflow-hidden">
              <h2 className="text-white font-semibold text-lg whitespace-nowrap">Admin Panel</h2>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-6 p-4">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`
                  ${isHovered ? 'w-full justify-start px-4' : 'w-12 justify-center'}
                  h-12 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0d0e0a] text-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-[#0d0e0a]'
                  }
                `}
                title={!isHovered ? item.label : undefined}
              >
                <Icon size={20} />
                {isHovered && (
                  <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;