import { Hexagon, Zap, ShoppingBag, UserPlus } from 'lucide-react';

const SalesCards = () => {
  const cards = [
    {
      icon: Hexagon,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      value: '$5k',
      label: 'Total Sales',
      change: '+10% from yesterday',
      changeColor: 'text-orange-400',
    },
    {
      icon: Zap,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
      value: '500',
      label: 'Total Order',
      change: '+8% from yesterday',
      changeColor: 'text-green-400',
    },
    {
      icon: ShoppingBag,
      iconColor: 'text-gray-400',
      iconBg: 'bg-gray-500/10',
      value: '9',
      label: 'Product Sold',
      change: '+2% from yesterday',
      changeColor: 'text-gray-400',
    },
    {
      icon: UserPlus,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      value: '12',
      label: 'New Customer',
      change: '+3% from yesterday',
      changeColor: 'text-cyan-400',
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Today's Sales</h2>
        <p className="text-gray-500 mt-1">Sales Summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-[#15170f] rounded-2xl p-5 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200"
            >
              <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={24} className={card.iconColor} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-gray-400 text-sm mb-2">{card.label}</div>
              <div className={`text-xs ${card.changeColor} font-medium`}>{card.change}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesCards;