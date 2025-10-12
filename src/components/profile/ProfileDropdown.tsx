import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  ChevronDown, 
  Edit, 
  Key, 
  Bell,
  Moon,
  Sun,
  Activity
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';

interface ProfileDropdownProps {
  onProfileClick: () => void;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onProfileClick, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUserStore();
  const { preferences, updatePreferences } = useProfileStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = async () => {
    const newTheme = preferences?.theme === 'dark' ? 'light' : 'dark';
    console.log('Toggling theme from', preferences?.theme, 'to', newTheme); // Debug log
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'My Profile',
      description: 'View and edit profile',
      onClick: () => {
        onProfileClick();
        setIsOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Account Settings',
      description: 'Manage preferences',
      onClick: () => {
        onProfileClick();
        setIsOpen(false);
      }
    },
    {
      icon: Key,
      label: 'Change Password',
      description: 'Update security',
      onClick: () => {
        onProfileClick();
        setIsOpen(false);
      }
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage alerts',
      onClick: () => {
        onProfileClick();
        setIsOpen(false);
      }
    },
    {
      icon: Activity,
      label: 'Activity Log',
      description: 'View recent actions',
      onClick: () => {
        onProfileClick();
        setIsOpen(false);
      }
    }
  ];

  if (!currentUser) return null;

  const currentTheme = preferences?.theme || 'dark';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors group"
      >
        {(currentUser as any).avatar ? (
          <img
            src={(currentUser as any).avatar}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-600 dark:ring-slate-600 light:ring-gray-300 group-hover:ring-slate-500 dark:group-hover:ring-slate-500 light:group-hover:ring-gray-400 transition-all"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center ring-2 ring-slate-600 dark:ring-slate-600 light:ring-gray-300 group-hover:ring-slate-500 dark:group-hover:ring-slate-500 light:group-hover:ring-gray-400 transition-all">
            <span className="text-white font-bold text-sm">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-white dark:text-white light:text-gray-900 font-medium text-sm">{currentUser.name}</p>
          <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {currentUser.role}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-400 light:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border-b border-slate-700 dark:border-slate-700 light:border-gray-200">
            <div className="flex items-center gap-3">
              {(currentUser as any).avatar ? (
                <img
                  src={(currentUser as any).avatar}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-white dark:text-white light:text-gray-900 font-semibold">{currentUser.name}</h3>
                <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded-full">
                    <Shield className="w-3 h-3 text-red-400" />
                    <span className="text-red-400 text-xs font-medium">{currentUser.role}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-xs font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="p-2 bg-slate-700 dark:bg-slate-700 light:bg-gray-100 group-hover:bg-slate-600 dark:group-hover:bg-slate-600 light:group-hover:bg-gray-200 rounded-lg transition-colors">
                  <item.icon className="w-4 h-4 text-slate-400 dark:text-slate-400 light:text-gray-500 group-hover:text-white dark:group-hover:text-white light:group-hover:text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="text-white dark:text-white light:text-gray-900 font-medium text-sm">{item.label}</p>
                  <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">{item.description}</p>
                </div>
              </button>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="p-2 bg-slate-700 dark:bg-slate-700 light:bg-gray-100 group-hover:bg-slate-600 dark:group-hover:bg-slate-600 light:group-hover:bg-gray-200 rounded-lg transition-colors">
                {currentTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-slate-400 dark:text-slate-400 light:text-gray-500 group-hover:text-yellow-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-400 dark:text-slate-400 light:text-gray-500 group-hover:text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white dark:text-white light:text-gray-900 font-medium text-sm">
                  {currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </p>
                <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">Switch appearance</p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
            >
              <div className="p-2 bg-red-500/10 group-hover:bg-red-500/20 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-medium text-sm">Sign Out</p>
                <p className="text-red-400/70 text-xs">End your session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;