import { Search, Bell, Menu } from 'lucide-react';

const TopNav = () => {
  return (
    <header className="h-[80px] bg-[#15170f] border-b border-gray-800 flex items-center px-6">
      <button className="mr-4 text-gray-400 hover:text-white transition-colors lg:hidden">
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search here..."
            className="w-full h-12 bg-[#0d0e0a] border border-gray-800 rounded-xl pl-12 pr-4 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="ml-6 flex items-center gap-4">
        <button className="relative w-10 h-10 rounded-lg bg-[#0d0e0a] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"
            alt="User"
            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/30"
          />
          <span className="text-sm text-gray-400 hidden lg:block">▼</span>
        </button>
      </div>
    </header>
  );
};

export default TopNav;