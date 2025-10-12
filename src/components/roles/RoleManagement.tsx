import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Shield, Users, CheckCircle } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import RoleForm from './RoleForm';
import RoleDetails from './RoleDetails';

const RoleManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    roles,
    permissions,
    users,
    loading,
    error,
    fetchRoles,
    fetchPermissions,
    fetchUsers,
    createRole,
    updateRole,
    deleteRole,
    hasPermission
  } = useUserStore();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  const filteredRoles = React.useMemo(() => {
    if (!searchTerm) return roles;
    
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setCurrentView('create');
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setCurrentView('edit');
  };

  const handleViewRole = (role: any) => {
    setSelectedRole(role);
    setCurrentView('details');
  };

  const handleDeleteRole = async (roleId: string) => {
    const usersWithRole = users.filter(user => user.roleId === roleId);
    
    if (usersWithRole.length > 0) {
      alert(`Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this role?')) {
      await deleteRole(roleId);
    }
  };

  const handleSubmitRole = async (roleData: any) => {
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, roleData);
      } else {
        await createRole(roleData);
      }
      setCurrentView('list');
      setSelectedRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserCountForRole = (roleId: string) => {
    return users.filter(user => user.roleId === roleId).length;
  };

  if (!hasPermission('roles.view')) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-red-400">You don't have permission to view roles & permissions.</p>
        </div>
      </div>
    );
  }

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <RoleForm
        role={selectedRole}
        permissions={permissions}
        onSubmit={handleSubmitRole}
        onCancel={() => setCurrentView('list')}
        canDelete={selectedRole && hasPermission('roles.manage')}
        onDelete={selectedRole ? () => handleDeleteRole(selectedRole.id) : undefined}
      />
    );
  }

  if (currentView === 'details') {
    return (
      <RoleDetails
        role={selectedRole}
        permissions={permissions}
        users={users}
        onEdit={() => handleEditRole(selectedRole)}
        onBack={() => setCurrentView('list')}
        canEdit={hasPermission('roles.manage')}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Roles & Permissions</h1>
            <p className="text-slate-400">Manage user roles and their permissions</p>
          </div>
          {hasPermission('roles.manage') && (
            <button
              onClick={handleCreateRole}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Role
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Roles</p>
                <p className="text-2xl font-bold text-white">{roles.length}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Permissions</p>
                <p className="text-2xl font-bold text-white">{permissions.length}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Users Assigned</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Role List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No roles found</h3>
            <p className="text-slate-400">Try adjusting your search or create a new role</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                      <p className="text-slate-400 text-sm">{getUserCountForRole(role.id)} users</p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm mb-4 line-clamp-2">{role.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400 text-sm">{role.permissions.length} permissions</span>
                  </div>
                  <span className="text-slate-400 text-xs">{formatDate(role.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewRole(role)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  
                  {hasPermission('roles.manage') && (
                    <button
                      onClick={() => handleEditRole(role)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  
                  {hasPermission('roles.manage') && getUserCountForRole(role.id) === 0 && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;