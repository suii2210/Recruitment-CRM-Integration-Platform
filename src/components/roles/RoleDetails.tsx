import React from 'react';
import { ArrowLeft, Edit, Shield, Users, CheckCircle, Calendar } from 'lucide-react';
import { Permission } from '../../store/userStore';

interface RoleDetailsProps {
  role: any;
  permissions: Permission[];
  users: any[];
  onEdit: () => void;
  onBack: () => void;
  canEdit: boolean;
}

const RoleDetails: React.FC<RoleDetailsProps> = ({
  role,
  permissions,
  users,
  onEdit,
  onBack,
  canEdit
}) => {
  const rolePermissions = permissions.filter(p => role.permissions.includes(p.id));
  const usersWithRole = users.filter(user => user.roleId === role.id);
  
  const groupedPermissions = React.useMemo(() => {
    const groups: { [key: string]: Permission[] } = {};
    rolePermissions.forEach(permission => {
      if (!groups[permission.category]) {
        groups[permission.category] = [];
      }
      groups[permission.category].push(permission);
    });
    return groups;
  }, [rolePermissions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">Role Details</h1>
              <p className="text-slate-400 mt-1">View role information and permissions</p>
            </div>
          </div>
          
          {canEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Role
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Role Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{role.name}</h2>
                  <p className="text-slate-400 text-sm">{usersWithRole.length} users assigned</p>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6">{role.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Permissions</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white font-medium">{role.permissions.length}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Users</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">{usersWithRole.length}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(role.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Updated</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(role.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Users */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Assigned Users</h3>
              
              {usersWithRole.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400">No users assigned to this role</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersWithRole.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-slate-400 text-xs">{user.email}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                Permissions ({role.permissions.length})
              </h3>
              
              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Permissions</h4>
                  <p className="text-slate-400">This role has no permissions assigned</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-white">{category}</h4>
                        <span className="text-slate-400 text-sm">
                          {categoryPermissions.length} permission{categoryPermissions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="bg-slate-700 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <div className="text-slate-300 font-medium text-sm">{permission.name}</div>
                                <div className="text-slate-400 text-xs mt-1">{permission.description}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDetails;