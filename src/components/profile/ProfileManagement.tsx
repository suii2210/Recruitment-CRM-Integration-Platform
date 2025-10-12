import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Edit, 
  Save, 
  Camera,
  Key,
  Bell,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Check,
  X,
  Upload,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertTriangle,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import ImageUpload from '../blog/ImageUpload';

interface ProfileManagementProps {
  onBack: () => void;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ onBack }) => {
  const { currentUser, updateUser } = useUserStore();
  const { 
    profile, 
    preferences, 
    activities, 
    loading,
    updateProfile, 
    changePassword, 
    updatePreferences, 
    uploadAvatar, 
    fetchActivities,
    setProfile,
    setPreferences
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'activity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    title: '',
    category: '',
    socialLinks: {
      twitter: '',
      linkedin: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferencesData, setPreferencesData] = useState({
    theme: 'dark' as 'light' | 'dark',
    emailNotifications: true,
    pushNotifications: false,
    loginNotifications: true,
    twoFactorEnabled: false
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Check if current user is admin (can change passwords)
  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  // Initialize data when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      console.log('Current user in ProfileManagement:', currentUser);
      console.log('Social links:', (currentUser as any).socialLinks);
      
      // Create a new social links object for this user with empty values
      console.log('Current user social links:', (currentUser as any).socialLinks);
      
      const userData = {
        name: currentUser.name || '',
        email: currentUser.email || '',
        bio: (currentUser as any).bio || '',
        phone: (currentUser as any).phone || '',
        location: (currentUser as any).location || '',
        website: (currentUser as any).website || '',
        title: (currentUser as any).title || 'MATV Staff',
        category: (currentUser as any).category || 'BUSINESS',
        socialLinks: {
          twitter: '',
          linkedin: ''
        }
      };
      
      setProfileData(userData);
      setProfile(userData);

      if ((currentUser as any).preferences) {
        const userPrefs = (currentUser as any).preferences;
        const prefsData = {
          theme: userPrefs.theme || 'dark',
          emailNotifications: userPrefs.emailNotifications ?? true,
          pushNotifications: userPrefs.pushNotifications ?? false,
          loginNotifications: userPrefs.loginNotifications ?? true,
          twoFactorEnabled: userPrefs.twoFactorEnabled ?? false
        };
        setPreferencesData(prefsData);
        setPreferences(prefsData);
      }

      // Fetch activities when profile tab is active
      if (activeTab === 'activity') {
        fetchActivities();
      }
    }
  }, [currentUser, activeTab]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      console.log('Saving profile data:', profileData);
      await updateProfile(profileData);
      setIsEditing(false);
      
      // Update the user store as well
      await updateUser(currentUser.id, {
        name: profileData.name,
        email: profileData.email,
        title: profileData.title,
        category: profileData.category,
        socialLinks: profileData.socialLinks
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!isAdmin) {
      alert('Only administrators can change passwords.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to change password');
    }
  };

  const handlePreferencesUpdate = async (key: string, value: any) => {
    const newPrefs = { ...preferencesData, [key]: value };
    setPreferencesData(newPrefs);
    
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferencesData(preferencesData);
    }
  };

  const handleAvatarUpload = async (imageUrl: string | null) => {
    if (imageUrl) {
      try {
        await uploadAvatar(imageUrl);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Failed to upload avatar. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  if (!currentUser) return null;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Profile Management</h1>
            <p className="text-slate-400 mt-1">Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              {/* Profile Summary */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {(currentUser as any).avatar ? (
                    <img
                      src={(currentUser as any).avatar}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-2xl">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0">
                    <ImageUpload
                      onImageSelect={handleAvatarUpload}
                      currentImage={(currentUser as any).avatar}
                    />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">{currentUser.name}</h3>
                <p className="text-slate-400 text-sm">{currentUser.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                    <Shield className="w-3 h-3 text-red-400" />
                    <span className="text-red-400 text-xs font-medium">{currentUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-500 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            // Reset form data
                            setProfileData({
                              name: currentUser.name || '',
                              email: currentUser.email || '',
                              bio: (currentUser as any).bio || '',
                              phone: (currentUser as any).phone || '',
                              location: (currentUser as any).location || '',
                              website: (currentUser as any).website || '',
                              title: (currentUser as any).title || 'MATV Staff',
                              category: (currentUser as any).category || 'BUSINESS',
                              socialLinks: {
                                twitter: '',
                                linkedin: ''
                              }
                            });
                          }}
                          className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Shield className="w-4 h-4" />
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={profileData.title}
                        onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="e.g. Senior Reporter, Editor"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Shield className="w-4 h-4" />
                        Category
                      </label>
                      <select
                        value={profileData.category}
                        onChange={(e) => setProfileData(prev => ({ ...prev, category: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      >
                        <option value="BUSINESS">BUSINESS</option>
                        <option value="TECHNOLOGY">TECHNOLOGY</option>
                        <option value="POLITICS">POLITICS</option>
                        <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                        <option value="SPORTS">SPORTS</option>
                        <option value="SCIENCE">SCIENCE</option>
                        <option value="HEALTH">HEALTH</option>
                        <option value="WORLD">WORLD</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter location"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Globe className="w-4 h-4" />
                        Website
                      </label>
                      <input
                        type="text"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="https://your-website.com"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Twitter className="w-4 h-4" />
                        Twitter Profile
                      </label>
                      <input
                        type="text"
                        value={profileData.socialLinks.twitter}
                        onChange={(e) => setProfileData(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                        }))}
                        disabled={!isEditing}
                        placeholder="Enter Twitter profile URL"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn Profile
                      </label>
                      <input
                        type="text"
                        value={profileData.socialLinks.linkedin}
                        onChange={(e) => setProfileData(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                        }))}
                        disabled={!isEditing}
                        placeholder="Enter LinkedIn profile URL"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <FileText className="w-4 h-4" />
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="mt-8 pt-6 border-t border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-slate-300 font-medium">Role</p>
                          <p className="text-slate-400 text-sm">{currentUser.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-slate-300 font-medium">Member Since</p>
                          <p className="text-slate-400 text-sm">{formatDate(currentUser.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-slate-300 font-medium">Last Login</p>
                          <p className="text-slate-400 text-sm">
                            {currentUser.lastLogin ? formatDate(currentUser.lastLogin) : 'Never'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div>
                          <p className="text-slate-300 font-medium">Status</p>
                          <p className="text-green-400 text-sm capitalize">{currentUser.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
                  
                  {/* Admin Access Notice */}
                  {!isAdmin && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-yellow-400 font-medium text-sm mb-1">Password Changes Restricted</h3>
                          <p className="text-yellow-300 text-xs leading-relaxed">
                            Only administrators can change passwords. If you need to update your password, 
                            please contact your system administrator.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Change Password */}
                  <div className={`bg-slate-700/50 rounded-lg p-6 mb-6 ${!isAdmin ? 'opacity-50' : ''}`}>
                    <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                    {!isAdmin && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">
                          <Shield className="w-4 h-4 inline mr-2" />
                          Administrator privileges required to change passwords
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            disabled={!isAdmin}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder={isAdmin ? "Enter current password" : "Access restricted"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            disabled={!isAdmin}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            disabled={!isAdmin}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder={isAdmin ? "Enter new password" : "Access restricted"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            disabled={!isAdmin}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            disabled={!isAdmin}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder={isAdmin ? "Confirm new password" : "Access restricted"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            disabled={!isAdmin}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handlePasswordChange}
                        disabled={loading || !isAdmin}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Key className="w-4 h-4" />
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  {/* Security Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                        <p className="text-slate-400 text-sm">Add an extra layer of security</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferencesData.twoFactorEnabled}
                          onChange={(e) => handlePreferencesUpdate('twoFactorEnabled', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Login Notifications</h4>
                        <p className="text-slate-400 text-sm">Get notified of new login attempts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferencesData.loginNotifications}
                          onChange={(e) => handlePreferencesUpdate('loginNotifications', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">Dark Mode</h4>
                            <p className="text-slate-400 text-sm">Use dark theme</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferencesData.theme === 'dark'}
                              onChange={(e) => handlePreferencesUpdate('theme', e.target.checked ? 'dark' : 'light')}
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">Email Notifications</h4>
                            <p className="text-slate-400 text-sm">Receive updates via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferencesData.emailNotifications}
                              onChange={(e) => handlePreferencesUpdate('emailNotifications', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">Push Notifications</h4>
                            <p className="text-slate-400 text-sm">Browser notifications</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferencesData.pushNotifications}
                              onChange={(e) => handlePreferencesUpdate('pushNotifications', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                    <button
                      onClick={() => fetchActivities()}
                      className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Activity className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-slate-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{activity.action}</p>
                            <div className="flex items-center gap-4 text-slate-400 text-sm mt-1">
                              <span>IP: {activity.ipAddress}</span>
                              {activity.userAgent && (
                                <span className="truncate max-w-xs">
                                  {activity.userAgent.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-slate-400 text-sm">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;