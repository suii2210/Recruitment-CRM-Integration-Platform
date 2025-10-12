import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon?: LucideIcon;
  iconColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  iconColor = 'text-red-500'
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {change && (
          <p className={`text-sm ${
            changeType === 'positive' ? 'text-green-400' : 'text-red-400'
          }`}>
            {changeType === 'positive' ? '+' : '-'}{change}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-2 rounded-lg bg-slate-700 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatsCard;