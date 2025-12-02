export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SM</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sweet Models</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Studios DK</p>
          <p className="text-lg font-semibold text-gray-900">Panel de Control</p>
        </div>
      </div>
    </header>
  );
}
