const TopProducts = () => {
  const products = [
    { id: '01', name: 'Home Decore Range', popularity: 78, color: 'bg-orange-500', sales: '78%' },
    { id: '02', name: 'Disney Princess Dress', popularity: 62, color: 'bg-cyan-500', sales: '62%' },
    { id: '03', name: 'Bathroom Essentials', popularity: 51, color: 'bg-blue-500', sales: '51%' },
    { id: '04', name: 'Apple Smartwatch', popularity: 29, color: 'bg-purple-500', sales: '29%' },
  ];

  return (
    <div className="bg-[#15170f] rounded-2xl p-6 border border-gray-800/50">
      <h3 className="text-xl font-semibold text-white mb-6">Top Products</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium text-sm pb-4 pr-4">#</th>
              <th className="text-left text-gray-500 font-medium text-sm pb-4 pr-4">Name</th>
              <th className="text-left text-gray-500 font-medium text-sm pb-4 pr-4">Popularity</th>
              <th className="text-left text-gray-500 font-medium text-sm pb-4">Sales</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index} className="border-b border-gray-800/50 last:border-0">
                <td className="py-4 pr-4">
                  <span className="text-gray-400 font-medium">{product.id}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-white font-medium">{product.name}</span>
                </td>
                <td className="py-4 pr-4">
                  <div className="w-full max-w-[200px]">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${product.color} rounded-full shadow-lg`}
                        style={{ width: `${product.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className="px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 text-sm border border-gray-700/50">
                    {product.sales}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopProducts;