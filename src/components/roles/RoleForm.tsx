import React, { useState } from 'react';
import { Save, ArrowLeft, Trash2, Shield, CheckCircle, Search } from 'lucide-react';
import { Permission } from '../../store/userStore';

interface RoleFormProps {
  role?: any;
  permissions: Permission[];
  onSubmit: (roleData: any) => Promise<void>;
  onCancel: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({
  role,
  permissions,
  onSubmit,
  onCancel,
  canDelete,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [...new Set(permissions.map(p => p.category))];
  
  const filteredPermissions = React.useMemo(() => {
    let result = permissions;
    
    if (searchTerm) {
      result = result.filter(permission =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(permission => permission.category === selectedCategory);
    }
    
    return result;
  }, [permissions, searchTerm, selectedCategory]);

  const groupedPermissions = React.useMemo(() => {
    const groups: { [key: string]: Permission[] } = {};
    filteredPermissions.forEach(permission => {
      if (!groups[permission.category]) {
        groups[permission.category] = [];
      }
      groups[permission.category].push(permission);
    });
    return groups;
  }, [filteredPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.permissions.length === 0) {
      alert('Please select at least one permission');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (role && confirm('Are you sure you want to delete this role?')) {
      onDelete?.();
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = permissions.filter(p => p.category === category).map(p => p.id);
    const allSelected = categoryPermissions.every(id => formData.permissions.includes(id));
    
    if (allSelected) {
      // Remove all category permissions
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !categoryPermissions.includes(id))
      }));
    } else {
      // Add all category permissions
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermissions])]
      }));
    }
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = permissions.filter(p => p.category === category).map(p => p.id);
    return categoryPermissions.length > 0 && categoryPermissions.every(id => formData.permissions.includes(id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = permissions.filter(p => p.category === category).map(p => p.id);
    return categoryPermissions.some(id => formData.permissions.includes(id)) && !isCategoryFullySelected(category);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
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
              {role ? 'Edit Role' : 'Create New Role'}
            </h1>
            <p className="text-slate-400 mt-1">
              {role ? 'Update role information and permissions' : 'Define a new role with specific permissions'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Selected Permissions
                </label>
                <div className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-300">
                  {formData.permissions.length} permission(s) selected
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role and its responsibilities"
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Permissions</h2>
            
            {/* Permission Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Permission Groups */}
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">{category}</h3>
                    <button
                      type="button"
                      onClick={() => toggleCategoryPermissions(category)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isCategoryFullySelected(category)
                          ? 'bg-green-500/20 text-green-400'
                          : isCategoryPartiallySelected(category)
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isCategoryFullySelected(category) ? 'All Selected' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryPermissions.map((permission) => (
                      <label
                        key={permission.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.permissions.includes(permission.id)
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 w-4 h-4 text-red-500 bg-slate-600 border-slate-500 rounded focus:ring-red-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="text-slate-300 font-medium text-sm">{permission.name}</div>
                          <div className="text-slate-400 text-xs mt-1">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
                {role ? 'Update Role' : 'Create Role'}
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
                Delete Role
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;