import React, { useState } from 'react';
import { Save, ArrowLeft, Trash2, User, Mail, Lock, Shield, Eye, EyeOff, Twitter, Linkedin } from 'lucide-react';
import { Role } from '../../store/userStore';

interface UserFormProps {
  user?: any;
  roles: Role[];
  onSubmit: (userData: any) => Promise<void>;
  onCancel: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  roles,
  onSubmit,
  onCancel,
  canDelete,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    roleId: user?.roleId || '',
    status: user?.status || 'active',
    socialLinks: user?.socialLinks ? {
      twitter: user.socialLinks.twitter || '',
      linkedin: user.socialLinks.linkedin || ''
    } : {
      twitter: '',
      linkedin: ''
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.roleId) {
      alert('Please fill in all required fields');
      return;
    }

    if (!user && !formData.password.trim()) {
      alert('Password is required for new users');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a deep copy of the form data to avoid reference issues
      const userData = { 
        ...formData,
        socialLinks: { 
          twitter: formData.socialLinks?.twitter || '',
          linkedin: formData.socialLinks?.linkedin || ''
        }
      };
      
      if (user && !formData.password.trim()) {
        delete userData.password; // Don't update password if not provided
      }
      
      // Set role name based on roleId
      const selectedRole = roles.find(role => role.id === formData.roleId);
      if (selectedRole) {
        userData.role = selectedRole.name;
      }
      
      await onSubmit(userData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (user && confirm('Are you sure you want to delete this user?')) {
      onDelete?.();
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user ? 'Edit User' : 'Create New User'}
            </h1>
            <p className="text-slate-400 mt-1">
              {user ? 'Update user information and permissions' : 'Add a new user to the system'}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <User className="w-4 h-4" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <Mail className="w-4 h-4" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <Lock className="w-4 h-4" />
                Password {!user && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={user ? "Leave blank to keep current password" : "Enter password"}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required={!user}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!user && (
                <p className="text-slate-400 text-sm mt-2">
                  Password should be at least 6 characters long
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <Shield className="w-4 h-4" />
                Role *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            {user && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
            
            {/* Social Media Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Social Media Links</h3>
              
              {/* Twitter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                  <Twitter className="w-4 h-4" />
                  Twitter Profile URL
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                  }))}
                  placeholder="Enter Twitter profile URL"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
              
              {/* LinkedIn */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                  }))}
                  placeholder="Enter LinkedIn profile URL"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-700">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {user ? 'Update User' : 'Create User'}
                </button>
                
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>

              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;