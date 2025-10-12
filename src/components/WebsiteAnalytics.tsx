import React from 'react';

const WebsiteAnalytics: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white relative overflow-hidden">
      {/* Background Circle */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-32 h-32 rounded-full border-4 border-white border-opacity-20"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold mb-1">Website Analytics</h3>
        <p className="text-red-100 text-sm mb-6">Total 24.9% Conversion Rate</p>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-red-100 text-sm mb-2">Traffic</h4>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">27%</div>
                <div className="text-red-100 text-xs">Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">1.2k</div>
                <div className="text-red-100 text-xs">Leads</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">4.2k</div>
                <div className="text-red-100 text-xs">Page Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold">8%</div>
                <div className="text-red-100 text-xs">Conversions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAnalytics;