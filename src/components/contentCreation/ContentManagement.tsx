import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Clock, CheckCircle, XCircle } from 'lucide-react';
import ContentForm from './ContentForm';
import ContentList from './ContentList';
import ContentPreview from './ContentPreview';
import { useContentStore } from '../../store/contentStore';

const ContentManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'preview'>('list');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'published'>('all');
  
  const { 
    contents, 
    loading, 
    error,
    currentUser,
    currentPage,
    totalPages,
    total,
    fetchContents, 
    createContent, 
    updateContent, 
    deleteContent,
    setPage
  } = useContentStore();

  useEffect(() => {
    fetchContents(currentPage, 10, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setPage(page);
  };



  const handleCreateContent = () => {
    setSelectedContent(null);
    setCurrentView('create');
  };

  const handleEditContent = (content: any) => {
    setSelectedContent(content);
    setCurrentView('edit');
  };

  const handlePreviewContent = (content: any) => {
    setSelectedContent(content);
    setCurrentView('preview');
  };

  const handleDeleteContent = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      await deleteContent(contentId);
    }
  };

  const handleSubmitContent = async (formData: any, status: string) => {
    try {
      const contentData = {
        ...formData,
        status,
        author: currentUser.name,
        authorId: currentUser.id,
        createdAt: selectedContent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (selectedContent) {
        await updateContent(selectedContent.id, contentData);
      } else {
        await createContent(contentData);
      }
      
      setCurrentView('list');
      setSelectedContent(null);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'draft': return 'text-slate-400 bg-slate-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return CheckCircle;
      case 'pending': return Clock;
      case 'draft': return Edit;
      default: return XCircle;
    }
  };

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <ContentForm
        content={selectedContent}
        currentUser={currentUser}
        onSubmit={handleSubmitContent}
        onDelete={selectedContent ? () => handleDeleteContent(selectedContent.id) : undefined}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'preview') {
    return (
      <ContentPreview
        content={selectedContent}
        onEdit={() => handleEditContent(selectedContent)}
        onBack={() => setCurrentView('list')}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
            <p className="text-slate-400">Create, manage, and publish your content</p>
          </div>
          <button
            onClick={handleCreateContent}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Content
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Contents</p>
                <p className="text-2xl font-bold text-white">{contents.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Edit className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Published</p>
                <p className="text-2xl font-bold text-white">
                  {contents.filter(content => content.status === 'published').length}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {contents.filter(content => content.status === 'pending').length}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {contents.filter(content => content.status === 'draft').length}
                </p>
              </div>
              <div className="p-3 bg-slate-500/10 rounded-lg">
                <Edit className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contents by title, content, or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
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
              </select>
            </div>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <ContentList
              contents={contents}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onPreview={handlePreviewContent}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                <p className="text-slate-400 text-sm">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, total)} of {total} results
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            1 === currentPage
                              ? 'bg-red-500 text-white border-2 border-red-400'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-2 border-transparent'
                          }`}
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-slate-400">...</span>
                        );
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            i === currentPage
                              ? 'bg-red-500 text-white border-2 border-red-400'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-2 border-transparent'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-slate-400">...</span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            totalPages === currentPage
                              ? 'bg-red-500 text-white border-2 border-red-400'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-2 border-transparent'
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  </div>
                  
                  {/* Go to page input */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Go to:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      placeholder="Page"
                      className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const page = parseInt((e.target as HTMLInputElement).value);
                          if (page >= 1 && page <= totalPages) {
                            handlePageChange(page);
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
        )}
      </div>
    </div>
  );
};

export default ContentManagement;