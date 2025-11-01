import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Shield, Info } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(formData.email, formData.password);
    if (success) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-[#15170f] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-12 h-12 text-green-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))' }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Sign in with your administrator credentials</p>
          </div>

          {/* Admin Info */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-cyan-400 font-medium text-sm mb-1">Administrator Access Only</h3>
                <p className="text-cyan-300 text-xs leading-relaxed">
                  This system is for authorized administrators only. If you need access or password reset, 
                  contact your system administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
                  placeholder="Enter your admin email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl pl-10 pr-12 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black border-2 border-green-400 hover:bg-green-900 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-400/20"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-3">
                Need help accessing your account?
              </p>
              <div className="space-y-2">
                <p className="text-slate-500 text-xs">
                  • Contact your system administrator for password reset
                </p>
                <p className="text-slate-500 text-xs">
                  • Only authorized personnel can create new accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;