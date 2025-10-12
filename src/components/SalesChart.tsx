import React from 'react';

const SalesChart: React.FC = () => {
  const chartData = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 45 },
    { day: 'Wed', value: 78 },
    { day: 'Thu', value: 52 },
    { day: 'Fri', value: 89 },
    { day: 'Sat', value: 38 },
    { day: 'Sun', value: 95 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="mt-4">
      <div className="flex items-end justify-between h-24 gap-2">
        {chartData.map((data, index) => (
          <div key={index} className="flex-1 flex items-end">
            <div 
              className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm transition-all duration-300 hover:from-red-400 hover:to-red-300"
              style={{ 
                height: `${(data.value / maxValue) * 100}%`,
                minHeight: '4px'
              }}
            ></div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-400">
        {chartData.map((data, index) => (
          <span key={index}>{data.day}</span>
        ))}
      </div>
    </div>
  );
};

export default SalesChart;