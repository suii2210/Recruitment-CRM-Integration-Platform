import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Layers } from 'lucide-react';
import { useBlogStore } from '../../store/blogStore';
import { useUserStore } from '../../store/userStore';
import BlogList from './BlogList';
import BlogForm from './BlogForm';
import BlogPreview from './BlogPreview';

const BlogManagement: React.FC = () => {
  const {
    blogs,
    currentBlog,
    loading,
    pagination,
    fetchBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    publishBlog,
    unpublishBlog,
    incrementViewCount,
    setCurrentBlog
  } = useBlogStore();

  const { currentUser, hasPermission, userPermissions } = useUserStore();

  // Debug permissions
  useEffect(() => {
    console.log('Current user:', currentUser);
    console.log('User permissions:', userPermissions);
    console.log('Has blogs.view permission:', hasPermission('blogs.view'));
    console.log('Has blogs.edit permission:', hasPermission('blogs.edit'));
    console.log('Has blogs.delete permission:', hasPermission('blogs.delete'));
  }, [currentUser, userPermissions, hasPermission]);

  const [view, setView] = useState<'list' | 'form' | 'preview'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWebsite, setSelectedWebsite] = useState("Conservative");
  const [fabExpanded, setFabExpanded] = useState(false);

  const statusOptions = [
    { id: "all", label: "All Status" },
    { id: "published", label: "Published" },
    { id: "draft", label: "Draft" },
    { id: "archived", label: "Archive" },
  ];

  const categoryOptions = [
    { id: "all", label: "All Categories" },
    { id: "technology", label: "Technology" },
    { id: "design", label: "Design" },
    { id: "business", label: "Business" },
  ];

  useEffect(() => {
    loadBlogs();
  }, [selectedStatus, selectedCategory, selectedWebsite]);

  const loadBlogs = async () => {
    try {
      await fetchBlogs({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        website: selectedWebsite,
        page: pagination.page
      });
    } catch (error) {
      console.error('Error loading blogs:', error);
    }
  };

  const handleCreateNew = () => {
    setCurrentBlog(null);
    setView('form');
  };

  const handleEdit = (blog: any) => {
    setCurrentBlog(blog);
    setView('form');
  };

  const handleView = (blog: any) => {
    setCurrentBlog(blog);
    setView('preview');
  };

  const handleFormSubmit = async (formData: any, status: string) => {
    try {
      if (currentBlog) {
        await updateBlog(currentBlog.id, { ...formData, status });
      } else {
        await createBlog({ ...formData, status });
      }
      setView('list');
      loadBlogs();
    } catch (error: any) {
      alert(error.message || 'Error saving blog');
    }
  };

  const handleDelete = async (blogId: string) => {
    try {
      await deleteBlog(blogId);
      loadBlogs();
      if (view !== 'list') {
        setView('list');
      }
    } catch (error: any) {
      alert(error.message || 'Error deleting blog');
    }
  };

  const handleCancel = () => {
    setCurrentBlog(null);
    setView('list');
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (view === 'form') {
    return (
      <div style={{ backgroundColor: "#0d0e0a", minHeight: "100vh" }}>
        <BlogForm
          blog={currentBlog || undefined}
          currentUser={currentUser}
          onSubmit={handleFormSubmit}
          onDelete={currentBlog ? handleDelete : undefined}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (view === 'preview' && currentBlog) {
    return (
      <div style={{ backgroundColor: "#0d0e0a", minHeight: "100vh" }}>
        <BlogPreview
          blog={currentBlog}
          onBack={handleCancel}
          incrementViewCount={incrementViewCount}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d0e0a" }}>
      {/* Main Content */}
      <main className="px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-3" style={{ color: "#f1f5f9" }}>
            Blog Management
          </h2>
          <p className="text-lg" style={{ color: "#9ca3af" }}>
            Create and manage your blog posts
          </p>
        </div>

        {/* Website Filter Navbar */}
        <div className="mb-8">
          <div className="flex justify-center border-b border-gray-800">
            {['Conservative', 'Bihaan', 'Pkltd'].map((website) => (
              <button
                key={website}
                onClick={() => setSelectedWebsite(website)}
                className={`pb-4 px-8 text-lg font-medium transition-all duration-500 ease-in-out relative ${
                  selectedWebsite === website ? 'text-green-400' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {website}
                {selectedWebsite === website && (
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-green-400 transition-all duration-500 ease-in-out"
                    style={{ 
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                      width: website === 'Conservative' ? '100px' : website === 'Bihaan' ? '60px' : '50px'
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex flex-col gap-6">
          {/* Search and Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#6b7280" }} />
              <input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 transition-all duration-200 w-full rounded-lg"
                style={{
                  backgroundColor: "#15170f",
                  borderColor: "#1f2937",
                  color: "#f1f5f9",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#22d3ee";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34, 211, 238, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#1f2937";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Status Filter Button */}
            <div className="relative group">
              <button
                className="h-12 px-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: "#15170f",
                  borderColor: "#1f2937",
                  color: "#f1f5f9",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#22d3ee";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1f2937";
                }}
              >
                <Filter className="w-4 h-4" style={{ color: "#22d3ee" }} />
                <span className="text-sm font-medium">Status</span>
              </button>
              <div
                className="absolute top-full left-0 mt-2 w-48 rounded-lg border-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                style={{
                  backgroundColor: "#15170f",
                  borderColor: "#1f2937",
                }}
              >
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedStatus(option.id)}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-opacity-50 transition-colors border-b last:border-b-0"
                    style={{
                      backgroundColor: selectedStatus === option.id ? "#1f2937" : "transparent",
                      borderColor: "#1f2937",
                      color: "#f1f5f9",
                    }}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Button */}
            <div className="relative group">
              <button
                className="h-12 px-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: "#15170f",
                  borderColor: "#1f2937",
                  color: "#f1f5f9",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#22d3ee";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1f2937";
                }}
              >
                <Layers className="w-4 h-4" style={{ color: "#22d3ee" }} />
                <span className="text-sm font-medium">Category</span>
              </button>
              <div
                className="absolute top-full left-0 mt-2 w-48 rounded-lg border-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                style={{
                  backgroundColor: "#15170f",
                  borderColor: "#1f2937",
                }}
              >
                {categoryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedCategory(option.id)}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-opacity-50 transition-colors border-b last:border-b-0"
                    style={{
                      backgroundColor: selectedCategory === option.id ? "#1f2937" : "transparent",
                      borderColor: "#1f2937",
                      color: "#f1f5f9",
                    }}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blog List or Empty State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#22d3ee" }}></div>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <BlogList
            blogs={filteredBlogs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPublish={publishBlog}
            onUnpublish={unpublishBlog}
            onView={handleView}
            hasPermission={hasPermission}
          />
        ) : (
          <div
            className="rounded-xl p-16 flex flex-col items-center justify-center text-center border-2"
            style={{
              backgroundColor: "#15170f",
              borderColor: "#1f2937",
              minHeight: "400px",
            }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border-2"
              style={{
                borderColor: "#1f2937",
                backgroundColor: "#0d0e0a",
              }}
            >
              <svg
                className="w-10 h-10"
                style={{ color: "#6b7280" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
              No Blogs Found
            </h3>
            <p style={{ color: "#9ca3af" }}>Get started by creating your first blog post.</p>
          </div>
        )}
      </main>

      {hasPermission('blogs.create') && (
        <button
          onClick={handleCreateNew}
          onMouseEnter={() => setFabExpanded(true)}
          onMouseLeave={() => setFabExpanded(false)}
          className="fixed bottom-8 right-8 flex items-center justify-center gap-3 transition-all duration-500 ease-out font-medium"
          style={{
            width: fabExpanded ? "200px" : "56px",
            height: "56px",
            backgroundColor: "#0d0e0a",
            border: "2px solid #22d3ee",
            borderRadius: "50px",
            boxShadow: fabExpanded
              ? "0 0 30px rgba(34, 211, 238, 0.8), inset 0 0 20px rgba(34, 211, 238, 0.2)"
              : "0 0 15px rgba(34, 211, 238, 0.4)",
            color: "#f1f5f9",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
        <Plus
          className="w-6 h-6 flex-shrink-0"
          style={{
            color: "#22d3ee",
            transform: fabExpanded ? "rotate(360deg)" : "rotate(0deg)",
            transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
        {fabExpanded && (
          <span
            className="text-sm whitespace-nowrap"
            style={{
              animation: "slideIn 0.4s ease-out",
            }}
          >
            Create New Blogs
          </span>
        )}
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BlogManagement;