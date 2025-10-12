import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  color = 'bg-red-500', 
  height = 'h-2' 
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className={`w-full bg-slate-700 rounded-full ${height}`}>
      <div 
        className={`${color} ${height} rounded-full transition-all duration-300 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;