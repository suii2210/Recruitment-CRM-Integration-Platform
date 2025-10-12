import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface DataPoint {
  time: string;
  users: number;
  blogs: number;
  activities: number;
}

const LiveChart: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'blogs' | 'activities'>('users');

  useEffect(() => {
    // Generate initial data
    const initialData: DataPoint[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      initialData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        users: Math.floor(Math.random() * 100) + 50,
        blogs: Math.floor(Math.random() * 20) + 5,
        activities: Math.floor(Math.random() * 50) + 10
      });
    }
    
    setData(initialData);

    // Update data every 30 seconds
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1)];
        const now = new Date();
        newData.push({
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          users: Math.floor(Math.random() * 100) + 50,
          blogs: Math.floor(Math.random() * 20) + 5,
          activities: Math.floor(Math.random() * 50) + 10
        });
        return newData;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'users': return 'stroke-blue-400 fill-blue-400/20';
      case 'blogs': return 'stroke-purple-400 fill-purple-400/20';
      case 'activities': return 'stroke-green-400 fill-green-400/20';
      default: return 'stroke-slate-400 fill-slate-400/20';
    }
  };

  const getMetricValue = (point: DataPoint) => {
    return point[selectedMetric];
  };

  const maxValue = Math.max(...data.map(getMetricValue));
  const minValue = Math.min(...data.map(getMetricValue));
  const range = maxValue - minValue || 1;

  const createPath = () => {
    if (data.length === 0) return '';
    
    const width = 400;
    const height = 120;
    const stepX = width / (data.length - 1);
    
    let path = '';
    
    data.forEach((point, index) => {
      const x = index * stepX;
      const y = height - ((getMetricValue(point) - minValue) / range) * height;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const createAreaPath = () => {
    const linePath = createPath();
    if (!linePath) return '';
    
    const width = 400;
    const height = 120;
    
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  const currentValue = data.length > 0 ? getMetricValue(data[data.length - 1]) : 0;
  const previousValue = data.length > 1 ? getMetricValue(data[data.length - 2]) : 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(1) : '0';

  return (
    <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm h-[550px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">Live Analytics</h3>
        <div className="flex items-center gap-1 bg-slate-700 dark:bg-slate-700 light:bg-gray-100 rounded-lg p-1">
          {(['users', 'blogs', 'activities'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedMetric === metric
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white dark:text-white light:text-gray-900">
            {currentValue.toLocaleString()}
          </span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            change >= 0 
              ? 'text-green-400 bg-green-400/10' 
              : 'text-red-400 bg-red-400/10'
          }`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {changePercent}%
          </div>
        </div>
        <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm mt-1">
          Last 24 hours • Updates every 30 seconds
        </p>
      </div>

      <div className="relative">
        <svg width="100%" height="120" viewBox="0 0 400 120" className="overflow-visible">
          <defs>
            <linearGradient id={`gradient-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area */}
          <path
            d={createAreaPath()}
            className={getMetricColor(selectedMetric)}
            fill={`url(#gradient-${selectedMetric})`}
          />
          
          {/* Line */}
          <path
            d={createPath()}
            className={getMetricColor(selectedMetric)}
            fill="none"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = 120 - ((getMetricValue(point) - minValue) / range) * 120;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                className={getMetricColor(selectedMetric)}
                fill="currentColor"
              />
            );
          })}
        </svg>
        
        {/* Live indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-medium">LIVE</span>
        </div>
      </div>

      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-400 light:text-gray-500 mt-2">
        <span>{data.length > 0 ? data[0].time : ''}</span>
        <span>{data.length > 0 ? data[data.length - 1].time : ''}</span>
      </div>
    </div>
  );
};

export default LiveChart;