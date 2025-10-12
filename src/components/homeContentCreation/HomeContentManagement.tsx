import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react';
import HomeContentForm from './HomeContentForm';
import HomeContentList from './HomeContentList';
import HomeContentPreview from './HomeContentPreview';
import { useHomeContentStore } from '../../store/homeContentStore';

interface HomeContentManagementProps {
  onCreateNew?: () => void;
}

const HomeContentManagement: React.FC<HomeContentManagementProps> = ({ onCreateNew }) => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'preview'>('list');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'published' | 'rejected'>('all');
  
  const { 
    homeContents, 
    loading, 
    error,
    stats,
    pagination,
    fetchHomeContents, 
    deleteHomeContent,
    publishHomeContent,
    unpublishHomeContent,
    toggleFeatured,
    fetchStats,
    setFilters,
    clearError
  } = useHomeContentStore();

  useEffect(() => {
    console.log("Fetcheddd home contents:", homeContents);

    fetchHomeContents();
    fetchStats();
  }, []);

  // Effect to handle search and filter changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      const filters: any = {};
      
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      // Reset to page 1 when searching/filtering
      filters.page = 1;
      
      setFilters(filters);
      fetchHomeContents(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter]);

  // Remove client-side filtering since we're now doing server-side search
  const filteredContents = homeContents;

  const handleCreateContent = () => {
    setSelectedContent(null);
    setCurrentView('create');
    if (onCreateNew) {
      onCreateNew();
    }
  };

  const handleEditContent = (id: number) => {
    const content = homeContents.find(c => c.id === id);
    setSelectedContent(content);
    setCurrentView('edit');
  };

  const handlePreviewContent = (id: number) => {
    const content = homeContents.find(c => c.id === id);
    setSelectedContent(content);
    setCurrentView('preview');
  };

  const handleDeleteContent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this home content?')) {
      clearError();
      await deleteHomeContent(id);
    }
  };

  const handlePublishContent = async (id: number) => {
    if (window.confirm('Are you sure you want to publish this home content?')) {
      clearError();
      await publishHomeContent(id);
    }
  };



  const handleToggleFeatured = async (id: number) => {
    clearError();
    await toggleFeatured(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'draft': return 'text-slate-400 bg-slate-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return CheckCircle;
      case 'pending': return Clock;
      case 'draft': return Edit;
      case 'rejected': return XCircle;
      default: return XCircle;
    }
  };

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <HomeContentForm
        onBack={() => setCurrentView('list')}
        content={selectedContent}
        isEdit={currentView === 'edit'}
        onSubmit={async (formData, status) => {
          clearError();
          if (currentView === 'edit') {
            await useHomeContentStore.getState().updateHomeContent(selectedContent.id, { ...formData, status });
          } else {
            await useHomeContentStore.getState().createHomeContent({ ...formData, status });
          }
          setCurrentView('list');
        }}
        onDelete={currentView === 'edit' ? async (id) => {
          await deleteHomeContent(parseInt(id));
          setCurrentView('list');
        } : undefined}
      />
    );
  }

  if (currentView === 'preview') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('list')}
              className="text-slate-400 hover:text-white flex items-center gap-2"
            >
              ← Back to List
            </button>
            <button
              onClick={() => handleEditContent(selectedContent?.id)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Content
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h1 className="text-3xl font-bold text-white mb-4">{selectedContent?.title}</h1>
            <p className="text-slate-400 mb-6">{selectedContent?.metaDescription || selectedContent?.description}</p>
            {selectedContent?.imageUrl && (
              <img 
                src={selectedContent.imageUrl} 
                alt={selectedContent.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            <div 
              className="text-slate-300 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedContent?.content || '' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Home Content Management</h1>
            <p className="text-slate-400">Create, manage, and publish your home page content</p>
          </div>
          <button
            onClick={handleCreateContent}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Home Content
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Contents</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Published</p>
                <p className="text-2xl font-bold text-white">{stats.published}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Drafts</p>
                <p className="text-2xl font-bold text-white">{stats.drafts}</p>
              </div>
              <div className="p-3 bg-slate-500/10 rounded-lg">
                <Edit className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-sm">{error}</span>
                <button 
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                {loading ? (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                )}
                <input
                  type="text"
                  placeholder="Search home contents by title, content, or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-10 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error && !homeContents.length ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : homeContents.length > 0 ? (
          <>
            <HomeContentList
              items={homeContents}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onPreview={handlePreviewContent}
              onPublish={handlePublishContent}
              onToggleFeatured={handleToggleFeatured}
            />
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const currentFilters = useHomeContentStore.getState().filters;
                        const newFilters = { ...currentFilters, page: pagination.currentPage - 1 };
                        setFilters(newFilters);
                        fetchHomeContents(newFilters);
                      }}
                      disabled={!pagination.hasPrevPage}
                      className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-white text-sm">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => {
                        const currentFilters = useHomeContentStore.getState().filters;
                        const newFilters = { ...currentFilters, page: pagination.currentPage + 1 };
                        setFilters(newFilters);
                        fetchHomeContents(newFilters);
                      }}
                      disabled={!pagination.hasNextPage}
                      className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
                    >
                      Next
                    </button>
                  </div>
                  
                  {/* Go to page input */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Go to:</span>
                    <input
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      placeholder="Page"
                      className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const page = parseInt((e.target as HTMLInputElement).value);
                          if (page >= 1 && page <= pagination.totalPages) {
                            const currentFilters = useHomeContentStore.getState().filters;
                            const newFilters = { ...currentFilters, page };
                            setFilters(newFilters);
                            fetchHomeContents(newFilters);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <FileText size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No home contents found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by creating your first home content'
              }
            </p>
            <button 
              onClick={handleCreateContent}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus size={20} />
              <span>Create New Home Content</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeContentManagement;