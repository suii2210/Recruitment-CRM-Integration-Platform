import React from 'react';
import { ArrowLeft, Edit, User, Mail, Shield, Calendar, Clock, UserCheck, UserX } from 'lucide-react';
import { Role } from '../../store/userStore';

interface UserDetailsProps {
  user: any;
  roles: Role[];
  onEdit: () => void;
  onBack: () => void;
  canEdit: boolean;
}

const UserDetails: React.FC<UserDetailsProps> = ({
  user,
  roles,
  onEdit,
  onBack,
  canEdit
}) => {
  const userRole = roles.find(role => role.id === user.roleId);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'inactive': return 'text-yellow-400 bg-yellow-400/10';
      case 'suspended': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return UserCheck;
      case 'inactive': return UserX;
      case 'suspended': return UserX;
      default: return UserX;
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

  const StatusIcon = getStatusIcon(user.status);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">User Details</h1>
              <p className="text-slate-400 mt-1">View user information and permissions</p>
            </div>
          </div>
          
          {canEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit User
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                <p className="text-slate-400 flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role</span>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-white font-medium">{user.role}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Login</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Updated</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(user.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Role & Permissions</h3>
              
              {userRole ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{userRole.name}</h4>
                    <p className="text-slate-400 mb-4">{userRole.description}</p>
                  </div>

                  <div>
                    <h5 className="text-md font-medium text-white mb-4">Permissions ({userRole.permissions.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userRole.permissions.map((permission) => (
                        <div key={permission} className="bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-slate-300 text-sm font-medium">
                              {permission.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Role created: {formatDate(userRole.createdAt)}</span>
                    </div>
                    {userRole.updatedAt !== userRole.createdAt && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Role updated: {formatDate(userRole.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No role assigned to this user</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;