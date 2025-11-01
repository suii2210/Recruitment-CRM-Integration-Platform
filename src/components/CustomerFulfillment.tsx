const CustomerFulfillment = () => {
  // Data points for the area chart
  const thisMonthData = [30, 25, 45, 35, 50, 42, 48, 44, 52];
  const lastMonthData = [20, 28, 22, 32, 28, 38, 32, 42, 35];

  const maxValue = Math.max(...thisMonthData, ...lastMonthData);
  const width = 100;
  const height = 60;

  // Convert data to SVG path
  const createPath = (data: number[]) => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const createAreaPath = (data: number[]) => {
    const path = createPath(data);
    const lastX = width;
    return `${path} L ${lastX},${height} L 0,${height} Z`;
  };

  return (
    <div className="bg-[#15170f] rounded-2xl p-6 border border-gray-800/50">
      <h3 className="text-xl font-semibold text-white mb-6">Customer Fulfillment</h3>

      <div className="relative h-64">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="tealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Last Month Area */}
          <path
            d={createAreaPath(lastMonthData)}
            fill="url(#purpleGradient)"
          />
          <path
            d={createPath(lastMonthData)}
            fill="none"
            stroke="#a855f7"
            strokeWidth="0.5"
          />

          {/* This Month Area */}
          <path
            d={createAreaPath(thisMonthData)}
            fill="url(#tealGradient)"
          />
          <path
            d={createPath(thisMonthData)}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-400"></div>
          <span className="text-gray-400">This Month</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-gray-400">Last Month</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">$120k</div>
          <div className="text-xs text-gray-500 mt-1">This Month</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">$98k</div>
          <div className="text-xs text-gray-500 mt-1">Last Month</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFulfillment;