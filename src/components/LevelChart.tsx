const LevelChart = () => {
  const bars = [
    { volume: 65, service: 45 },
    { volume: 75, service: 55 },
    { volume: 70, service: 48 },
    { volume: 60, service: 42 },
    { volume: 80, service: 60 },
    { volume: 90, service: 70 },
  ];

  return (
    <div className="bg-[#15170f] rounded-2xl p-6 border border-gray-800/50">
      <h3 className="text-xl font-semibold text-white mb-6">Level</h3>

      <div className="flex items-end justify-between h-64 gap-3 mb-4">
        {bars.map((bar, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div className="relative w-full flex gap-1 items-end">
              {/* Volume Bar */}
              <div
                className="flex-1 bg-gradient-to-t from-teal-400 to-teal-300 rounded-t-lg shadow-lg shadow-teal-500/20"
                style={{ height: `${bar.volume}%` }}
              ></div>
              {/* Service Bar */}
              <div
                className="flex-1 bg-gradient-to-t from-gray-600 to-gray-500 rounded-t-lg"
                style={{ height: `${bar.service}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-400"></div>
          <span className="text-gray-400">Volume</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-gray-400">Service</span>
        </div>
      </div>
    </div>
  );
};

export default LevelChart;